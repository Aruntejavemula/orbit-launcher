"""Weekly and bi-weekly engagement push notifications."""
from __future__ import annotations

import logging
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.push_subscription import PushSubscription
from models.engagement_log import EngagementLog
from tasks.send_push import send_push_notification
from tasks.send_fcm import send_fcm_notification

logger = logging.getLogger("orbit.engagement_notify")

WEEKLY_TYPE = "weekly_add_subscription"
BIWEEKLY_TYPE = "biweekly_budget_check"

_WEEKLY_PAYLOAD = {
    "title": "Track your subscriptions",
    "body": "Got any new subscriptions this week? Tap to add them to Remio.",
    "url": "/",
}

_BIWEEKLY_PAYLOAD = {
    "title": "Budget check-in",
    "body": "How's your monthly spend looking? Open Remio to review your budget.",
    "url": "/",
}


async def _already_sent(db: AsyncSession, user_id: UUID, type_: str, today: date) -> bool:
    row = await db.execute(
        select(EngagementLog.id).where(
            EngagementLog.user_id == user_id,
            EngagementLog.type == type_,
            EngagementLog.sent_date == today,
        )
    )
    return row.first() is not None


async def _record_sent(db: AsyncSession, user_id: UUID, type_: str, today: date) -> None:
    db.add(EngagementLog(user_id=user_id, type=type_, sent_date=today))
    await db.commit()


async def _send_to_user(db: AsyncSession, user_id: UUID, payload: dict, type_: str, today: date) -> bool:
    if await _already_sent(db, user_id, type_, today):
        return False

    subs = (
        await db.execute(select(PushSubscription).where(PushSubscription.user_id == user_id))
    ).scalars().all()

    if not subs:
        return False

    sent = False
    for sub in subs:
        try:
            if sub.fcm_token:
                ok = send_fcm_notification(sub.fcm_token, payload)
            elif sub.endpoint and sub.p256dh and sub.auth:
                ok = send_push_notification(sub.endpoint, sub.p256dh, sub.auth, payload)
            else:
                continue
            if ok:
                sent = True
        except Exception:
            logger.exception("Engagement push failed for user %s", user_id)

    if sent:
        await _record_sent(db, user_id, type_, today)

    return sent


async def _run_engagement(db: AsyncSession, type_: str, payload: dict, today: date) -> int:
    # Fetch all distinct user_ids that have at least one push subscription.
    rows = (await db.execute(select(PushSubscription.user_id).distinct())).scalars().all()
    sent = 0
    for user_id in rows:
        try:
            if await _send_to_user(db, user_id, payload, type_, today):
                sent += 1
        except Exception:
            logger.exception("Engagement notify failed for user %s", user_id)
    return sent


async def run_weekly_engagement(db: AsyncSession, today: date | None = None) -> int:
    """Send weekly 'add subscriptions' nudge. Only fires on Sundays."""
    today = today or date.today()
    if today.weekday() != 6:  # 6 = Sunday
        return 0
    logger.info("Running weekly engagement notifications for %s", today)
    sent = await _run_engagement(db, WEEKLY_TYPE, _WEEKLY_PAYLOAD, today)
    logger.info("Weekly engagement: %d sent", sent)
    return sent


async def run_biweekly_budget_reminder(db: AsyncSession, today: date | None = None) -> int:
    """Send bi-weekly budget check-in. Fires on even ISO week Sundays."""
    today = today or date.today()
    if today.weekday() != 6:  # must be Sunday
        return 0
    if today.isocalendar().week % 2 != 0:  # only even ISO weeks
        return 0
    logger.info("Running bi-weekly budget reminder for %s", today)
    sent = await _run_engagement(db, BIWEEKLY_TYPE, _BIWEEKLY_PAYLOAD, today)
    logger.info("Bi-weekly budget reminder: %d sent", sent)
    return sent
