"""Internal endpoints triggered by Railway cron — not user-facing."""
import logging
import os

from fastapi import APIRouter, Header, HTTPException

from database import engine as async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from tasks.renewal_notify import run_renewal_notifications

logger = logging.getLogger("orbit.internal")
router = APIRouter()

_CRON_SECRET = os.getenv("CRON_SECRET", "")

_SessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)


@router.post("/run-reminders")
async def run_reminders(x_cron_secret: str = Header(alias="X-Cron-Secret", default="")):
    if not _CRON_SECRET or x_cron_secret != _CRON_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    logger.info("Reminder cron triggered via HTTP")
    async with _SessionLocal() as db:
        sent = await run_renewal_notifications(db)
    logger.info("Reminder cron complete (%d notifications)", sent)
    return {"sent": sent}
