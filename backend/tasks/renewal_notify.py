"""
Renewal reminder delivery — per-app reminders + default prefs.reminder_days.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal
from uuid import UUID

from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from models import User, AppItem, Reminder, Preferences
from models.reminder import ReminderMethodEnum
from models.reminder_log import ReminderLog
from models.push_subscription import PushSubscription
from tasks.send_push import send_push_notification
from auth.renewal_email import send_renewal_reminder_email
from utils import as_utc

logger = logging.getLogger("orbit.renewal_notify")

Channel = Literal["email", "push"]

# Default automated reminders when the user has no per-app reminder for that offset.
DEFAULT_AUTOMATED_REMINDER_DAYS = (3, 1)


@dataclass(frozen=True)
class PendingDelivery:
    user: User
    app: AppItem
    days_before: int
    channel: Channel


def expiry_date_utc(expires_at: datetime) -> date:
    return as_utc(expires_at).date()


def days_until_expiry(expires_at: datetime, today: date) -> int:
    return (expiry_date_utc(expires_at) - today).days


def _add_pending(
    pending: list[PendingDelivery],
    seen: set[tuple],
    *,
    user: User,
    app: AppItem,
    days_before: int,
    channel: Channel,
) -> None:
    key = (str(user.id), str(app.id), days_before, channel)
    if key in seen:
        return
    seen.add(key)
    pending.append(PendingDelivery(user=user, app=app, days_before=days_before, channel=channel))


async def collect_pending_deliveries(db: AsyncSession, today: date) -> list[PendingDelivery]:
    pending: list[PendingDelivery] = []
    seen: set[tuple] = set()

    apps = (
        await db.execute(
            select(AppItem).where(
                AppItem.expires_at.isnot(None),
                AppItem.is_deleted == False,  # noqa: E712
            )
        )
    ).scalars().all()

    if not apps:
        return pending

    user_ids = {a.user_id for a in apps}
    users = {
        u.id: u
        for u in (
            await db.execute(select(User).where(User.id.in_(user_ids)))
        ).scalars().all()
    }
    prefs_by_user = {
        p.user_id: p
        for p in (
            await db.execute(select(Preferences).where(Preferences.user_id.in_(user_ids)))
        ).scalars().all()
    }

    reminders = (
        await db.execute(
            select(Reminder).where(
                Reminder.user_id.in_(user_ids),
                Reminder.active == True,  # noqa: E712
            )
        )
    ).scalars().all()
    reminders_by_app: dict[UUID, list[Reminder]] = {}
    for r in reminders:
        reminders_by_app.setdefault(r.app_id, []).append(r)

    for app in apps:
        user = users.get(app.user_id)
        if not user or not app.expires_at:
            continue

        days_left = days_until_expiry(app.expires_at, today)
        if days_left < 0:
            continue

        prefs = prefs_by_user.get(app.user_id)
        app_reminders = reminders_by_app.get(app.id, [])
        matched_explicit = False

        for r in app_reminders:
            if r.remind_days_before != days_left:
                continue
            matched_explicit = True
            if r.method == ReminderMethodEnum.email and prefs and prefs.reminder_email:
                _add_pending(pending, seen, user=user, app=app, days_before=days_left, channel="email")
            if r.method == ReminderMethodEnum.push and prefs and prefs.reminder_push:
                _add_pending(pending, seen, user=user, app=app, days_before=days_left, channel="push")

        if matched_explicit or not prefs:
            continue

        if days_left not in DEFAULT_AUTOMATED_REMINDER_DAYS:
            continue

        if prefs.reminder_email:
            _add_pending(pending, seen, user=user, app=app, days_before=days_left, channel="email")
        if prefs.reminder_push:
            _add_pending(pending, seen, user=user, app=app, days_before=days_left, channel="push")

    return pending


async def _already_sent(
    db: AsyncSession,
    user_id: UUID,
    app_id: UUID,
    days_before: int,
    channel: Channel,
    today: date,
) -> bool:
    row = (
        await db.execute(
            select(ReminderLog.id).where(
                ReminderLog.user_id == user_id,
                ReminderLog.app_id == app_id,
                ReminderLog.days_before == days_before,
                ReminderLog.channel == channel,
                ReminderLog.sent_date == today,
            )
        )
    ).scalar_one_or_none()
    return row is not None


def _plan_str(app: AppItem) -> str:
    p = app.plan
    return p.value if hasattr(p, "value") else str(p)


def _push_payload(app: AppItem, days_before: int) -> dict:
    label = "trial ends" if _plan_str(app) == "trial" else "renews"
    if days_before == 0:
        title = f"{app.name} {label} today"
        body = f"Your {app.name} subscription {label} today."
    elif days_before == 1:
        title = f"{app.name} {label} tomorrow"
        body = f"Your {app.name} subscription {label} tomorrow."
    else:
        title = f"{app.name} {label} in {days_before} days"
        body = f"Your {app.name} subscription {label} in {days_before} days."
    return {"title": title, "body": body, "icon": "/icon-192x192.png", "url": "/"}


async def _send_push(db: AsyncSession, user_id: UUID, app: AppItem, days_before: int) -> bool:
    subs = (
        await db.execute(select(PushSubscription).where(PushSubscription.user_id == user_id))
    ).scalars().all()
    if not subs:
        return False

    payload = _push_payload(app, days_before)
    expired_endpoints: list[str] = []
    sent_any = False
    for sub in subs:
        try:
            ok = send_push_notification(sub.endpoint, sub.p256dh, sub.auth, payload)
        except Exception:
            logger.exception("push send raised for %s", sub.endpoint[:60])
            ok = True
        if ok:
            sent_any = True
        else:
            expired_endpoints.append(sub.endpoint)

    for endpoint in expired_endpoints:
        await db.execute(sa_delete(PushSubscription).where(PushSubscription.endpoint == endpoint))

    return sent_any


async def deliver_one(db: AsyncSession, item: PendingDelivery, today: date) -> bool:
    """Send one notification; log on success. Returns True if delivered."""
    if await _already_sent(db, item.user.id, item.app.id, item.days_before, item.channel, today):
        return False

    try:
        if item.channel == "email":
            send_renewal_reminder_email(
                item.user.email,
                item.app.name,
                plan=_plan_str(item.app),
                expires_at=as_utc(item.app.expires_at),
                days_before=item.days_before,
            )
        else:
            if not await _send_push(db, item.user.id, item.app, item.days_before):
                return False
    except Exception:
        logger.exception(
            "renewal %s failed user=%s app=%s days=%d",
            item.channel,
            str(item.user.id)[:8],
            item.app.name,
            item.days_before,
        )
        return False

    db.add(
        ReminderLog(
            user_id=item.user.id,
            app_id=item.app.id,
            days_before=item.days_before,
            channel=item.channel,
            sent_date=today,
        )
    )
    await db.commit()
    return True


async def run_renewal_notifications(db: AsyncSession, today: date | None = None) -> int:
    """Process all due reminders for today. Returns count of notifications sent."""
    today = today or date.today()
    pending = await collect_pending_deliveries(db, today)
    sent = 0
    for item in pending:
        try:
            if await deliver_one(db, item, today):
                sent += 1
        except Exception:
            await db.rollback()
            logger.exception("deliver_one failed")
    logger.info("Renewal notifications: %d sent of %d pending for %s", sent, len(pending), today)
    return sent
