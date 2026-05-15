"""
Daily inactivity check — sends push notifications for apps not used in 7+ or 15+ days.
"""
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine as async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from models.app_item import AppItem
from models.preferences import Preferences
from models.push_subscription import PushSubscription
from tasks.send_push import send_push_notification

logger = logging.getLogger("orbit.inactivity_cron")

_SessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)

YELLOW_THRESHOLD_DAYS = 7
RED_THRESHOLD_DAYS = 15


async def run_inactivity_cron(ctx: dict) -> None:
    logger.info("Inactivity cron started")
    now = datetime.now(timezone.utc)

    async with _SessionLocal() as db:
        await _check_inactivity(db, now)

    logger.info("Inactivity cron complete")


async def _check_inactivity(db: AsyncSession, now: datetime):
    yellow_cutoff = now - timedelta(days=YELLOW_THRESHOLD_DAYS)

    result = await db.execute(
        select(AppItem).where(
            ~AppItem.is_deleted,
            AppItem.last_opened_at.isnot(None),
            AppItem.last_opened_at < yellow_cutoff,
        )
    )
    inactive_apps = result.scalars().all()

    if not inactive_apps:
        return

    user_apps: dict[str, list[tuple[AppItem, str]]] = {}
    for app in inactive_apps:
        uid = str(app.user_id)
        last = app.last_opened_at
        if last and last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        days = (now - last).days if last else 0
        level = "red" if days >= RED_THRESHOLD_DAYS else "yellow"
        user_apps.setdefault(uid, []).append((app, level))

    for user_id, app_levels in user_apps.items():
        try:
            await _notify_inactive_user(db, user_id, app_levels)
        except Exception:
            logger.exception("inactivity notify failed for user %s", user_id[:8])
            await db.rollback()


async def _notify_inactive_user(db: AsyncSession, user_id: str, app_levels: list[tuple[AppItem, str]]):
    prefs_result = await db.execute(
        select(Preferences).where(Preferences.user_id == user_id)
    )
    prefs = prefs_result.scalar_one_or_none()
    if not prefs or not prefs.reminder_push:
        return

    subs_result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    )
    subscriptions = subs_result.scalars().all()
    if not subscriptions:
        return

    red_apps = [a for a, level in app_levels if level == "red"]
    yellow_apps = [a for a, level in app_levels if level == "yellow"]

    if red_apps:
        names = ", ".join(a.name for a in red_apps[:3])
        if len(red_apps) > 3:
            names += f" and {len(red_apps) - 3} more"
        title = "Apps you haven't used in 15+ days"
        body = f"{names} — consider unsubscribing?"
        _send_to_devices(subscriptions, title, body)

    if yellow_apps:
        names = ", ".join(a.name for a in yellow_apps[:3])
        if len(yellow_apps) > 3:
            names += f" and {len(yellow_apps) - 3} more"
        title = "Apps you haven't used in a week"
        body = names
        _send_to_devices(subscriptions, title, body)


def _send_to_devices(subscriptions, title: str, body: str):
    payload = {
        "title": title,
        "body": body,
        "icon": "/appicon.jpeg",
        "url": "/",
    }
    for sub in subscriptions:
        try:
            send_push_notification(sub.endpoint, sub.p256dh, sub.auth, payload)
        except Exception:
            logger.exception("push send raised for %s", sub.endpoint[:60])
