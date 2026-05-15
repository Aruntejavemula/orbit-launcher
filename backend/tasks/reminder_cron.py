"""
Daily reminder cron — per-app reminders + default prefs (email & Web Push).
Runs at 9:00 AM UTC via ARQ worker.
"""
import logging
from datetime import date

from database import engine as async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from tasks.renewal_notify import run_renewal_notifications

logger = logging.getLogger("orbit.reminder_cron")

_SessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)


async def run_reminder_cron(ctx: dict) -> None:
    logger.info("Reminder cron started")
    async with _SessionLocal() as db:
        sent = await run_renewal_notifications(db)
    logger.info("Reminder cron complete (%d notifications)", sent)
