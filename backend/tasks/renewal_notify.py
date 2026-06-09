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
from models.engagement_log import EngagementLog
from tasks.send_push import send_push_notification
from tasks.send_fcm import send_fcm_notification
from auth.renewal_email import send_renewal_digest_email
from utils import as_utc

logger = logging.getLogger("orbit.renewal_notify")

Channel = Literal["email", "push"]

# Default automated reminders when the user has no per-app reminder for that offset.
DEFAULT_AUTOMATED_REMINDER_DAYS = (3, 1)

_DIGEST_EMAIL_TYPE = "renewal_digest_email"
_DIGEST_WINDOW_DAYS = 14


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
    expired_fcm_tokens: list[str] = []
    sent_any = False
    for sub in subs:
        try:
            if sub.platform == "android" and sub.fcm_token:
                ok = send_fcm_notification(sub.fcm_token, payload)
                if ok:
                    sent_any = True
                else:
                    expired_fcm_tokens.append(sub.fcm_token)
            elif sub.endpoint and sub.p256dh and sub.auth:
                ok = send_push_notification(sub.endpoint, sub.p256dh, sub.auth, payload)
                if ok:
                    sent_any = True
                else:
                    expired_endpoints.append(sub.endpoint)
        except Exception:
            label = (sub.fcm_token or sub.endpoint or "")[:60]
            logger.exception("push send raised for %s", label)
            sent_any = True

    for endpoint in expired_endpoints:
        await db.execute(sa_delete(PushSubscription).where(PushSubscription.endpoint == endpoint))
    for fcm_token in expired_fcm_tokens:
        await db.execute(sa_delete(PushSubscription).where(PushSubscription.fcm_token == fcm_token))

    return sent_any


async def _fetch_expiring_apps_for_user(
    db: AsyncSession, user_id: UUID, today: date, window: int = _DIGEST_WINDOW_DAYS
) -> list[AppItem]:
    rows = (
        await db.execute(
            select(AppItem).where(
                AppItem.user_id == user_id,
                AppItem.expires_at.isnot(None),
                AppItem.is_deleted == False,  # noqa: E712
            )
        )
    ).scalars().all()
    return [a for a in rows if 0 <= days_until_expiry(a.expires_at, today) <= window]


async def _digest_already_sent(db: AsyncSession, user_id: UUID, today: date) -> bool:
    row = (
        await db.execute(
            select(EngagementLog.id).where(
                EngagementLog.user_id == user_id,
                EngagementLog.type == _DIGEST_EMAIL_TYPE,
                EngagementLog.sent_date == today,
            )
        )
    ).scalar_one_or_none()
    return row is not None


async def deliver_email_digest(db: AsyncSession, user: User, today: date) -> bool:
    """Send one digest email per user listing all apps expiring within 14 days."""
    if await _digest_already_sent(db, user.id, today):
        return False

    expiring = await _fetch_expiring_apps_for_user(db, user.id, today)
    if not expiring:
        return False

    app_data = [
        {
            "name": a.name,
            "expires_at": as_utc(a.expires_at),
            "days_left": days_until_expiry(a.expires_at, today),
            "plan": _plan_str(a),
        }
        for a in expiring
    ]

    try:
        send_renewal_digest_email(user.email, app_data)
    except Exception:
        logger.exception("renewal digest email failed user=%s", str(user.id)[:8])
        return False

    db.add(EngagementLog(user_id=user.id, type=_DIGEST_EMAIL_TYPE, sent_date=today))
    await db.commit()
    return True


async def deliver_one(db: AsyncSession, item: PendingDelivery, today: date) -> bool:
    """Send one push notification; log on success. Returns True if delivered."""
    if item.channel != "push":
        return False
    if await _already_sent(db, item.user.id, item.app.id, item.days_before, item.channel, today):
        return False

    try:
        if not await _send_push(db, item.user.id, item.app, item.days_before):
            return False
    except Exception:
        logger.exception(
            "renewal push failed user=%s app=%s days=%d",
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

    # Send one digest email per unique user who has email-channel items.
    email_users: dict[UUID, User] = {}
    for item in pending:
        if item.channel == "email":
            email_users[item.user.id] = item.user

    sent = 0
    for user in email_users.values():
        try:
            if await deliver_email_digest(db, user, today):
                sent += 1
        except Exception:
            await db.rollback()
            logger.exception("deliver_email_digest failed user=%s", str(user.id)[:8])

    # Push notifications remain per-app.
    for item in pending:
        if item.channel != "push":
            continue
        try:
            if await deliver_one(db, item, today):
                sent += 1
        except Exception:
            await db.rollback()
            logger.exception("deliver_one push failed")

    logger.info("Renewal notifications: %d sent of %d pending for %s", sent, len(pending), today)
    return sent
