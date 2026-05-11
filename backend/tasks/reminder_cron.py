"""
Daily reminder cron — checks for apps expiring in exactly 3 days or 1 day.
Sends grouped Web Push notifications per user. Runs at 9:00 AM UTC.
"""
import logging
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import select, and_, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine as async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from models.app_item import AppItem
from models.preferences import Preferences
from models.push_subscription import PushSubscription
from models.reminder_log import ReminderLog
from tasks.send_push import send_push_notification

logger = logging.getLogger("orbit.reminder_cron")

_SessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)

_TRIGGER_DAYS = [3, 1]


async def run_reminder_cron(ctx: dict) -> None:
    logger.info("Reminder cron started")
    today = date.today()

    async with _SessionLocal() as db:
        for days_before in _TRIGGER_DAYS:
            target_date = today + timedelta(days=days_before)
            await _process_day(db, today, target_date, days_before)

    logger.info("Reminder cron complete")


async def _process_day(db: AsyncSession, today: date, target_date: date, days_before: int):
    # Find all apps expiring on target_date
    start = datetime(target_date.year, target_date.month, target_date.day, tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    apps_result = await db.execute(
        select(AppItem).where(
            AppItem.expires_at != None,  # noqa: E711
            AppItem.expires_at >= start,
            AppItem.expires_at < end,
        )
    )
    expiring_apps = apps_result.scalars().all()

    if not expiring_apps:
        return

    # Group by user
    user_apps: dict[str, list[AppItem]] = {}
    for app in expiring_apps:
        uid = str(app.user_id)
        user_apps.setdefault(uid, []).append(app)

    for user_id, apps in user_apps.items():
        try:
            await _notify_user(db, user_id, apps, days_before, today)
        except Exception:
            logger.exception("reminder notify failed for user %s (days_before=%d)", user_id[:8], days_before)
            await db.rollback()


async def _notify_user(db: AsyncSession, user_id: str, apps: list[AppItem], days_before: int, today: date):
    # Check preferences
    prefs_result = await db.execute(
        select(Preferences).where(Preferences.user_id == user_id)
    )
    prefs = prefs_result.scalar_one_or_none()
    if not prefs or not prefs.reminder_push:
        return

    # Check dedup
    existing_log = await db.execute(
        select(ReminderLog).where(
            ReminderLog.user_id == user_id,
            ReminderLog.days_before == days_before,
            ReminderLog.sent_date == today,
        )
    )
    if existing_log.scalar_one_or_none():
        return

    # Get push subscriptions
    subs_result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    )
    subscriptions = subs_result.scalars().all()
    if not subscriptions:
        return

    # Build notification
    app_names = [a.name for a in apps]
    count = len(app_names)

    if days_before == 1:
        title = f"{'1 subscription expires' if count == 1 else f'{count} subscriptions expire'} tomorrow"
    else:
        title = f"{'1 subscription expiring' if count == 1 else f'{count} subscriptions expiring'} in {days_before} days"

    body = ", ".join(app_names[:5])
    if count > 5:
        body += f" and {count - 5} more"

    payload = {
        "title": title,
        "body": body,
        "icon": "/appicon.jpeg",
        "url": "/",
    }

    # Send to all devices
    expired_endpoints = []
    for sub in subscriptions:
        try:
            success = send_push_notification(sub.endpoint, sub.p256dh, sub.auth, payload)
        except Exception:
            logger.exception("push send raised for %s", sub.endpoint[:60])
            success = True  # don't delete on unknown errors
        if not success:
            expired_endpoints.append(sub.endpoint)

    # Clean up expired subscriptions
    for endpoint in expired_endpoints:
        await db.execute(
            sa_delete(PushSubscription).where(PushSubscription.endpoint == endpoint)
        )

    # Log to prevent duplicates
    log = ReminderLog(user_id=user_id, days_before=days_before, sent_date=today)
    db.add(log)
    await db.commit()

    logger.info("Sent %d-day reminder to user %s (%d apps, %d devices)", days_before, user_id[:8], count, len(subscriptions))
