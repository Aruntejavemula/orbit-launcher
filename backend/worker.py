"""
ARQ worker — run with:
    arq worker.WorkerSettings
"""
import logging
import os
from arq.cron import cron
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("orbit.worker")


async def send_otp_email_task(ctx, to_email: str, otp: str) -> None:
    from auth.email_otp import send_otp_email
    send_otp_email(to_email, otp)


async def reminder_cron_task(ctx) -> None:
    from tasks.reminder_cron import run_reminder_cron
    await run_reminder_cron(ctx)


class WorkerSettings:
    redis_settings = None  # set below
    functions = [send_otp_email_task]
    cron_jobs = [
        cron(reminder_cron_task, hour=9, minute=0),  # Daily at 9:00 AM UTC
    ]
    max_tries = 3
    job_timeout = 60

    @classmethod
    def _get_redis_settings(cls):
        from arq.connections import RedisSettings
        url = os.getenv("REDIS_URL", "redis://localhost:6379")
        return RedisSettings.from_dsn(url)


# Lazy-resolve so import works even without Redis installed during tests
def _init():
    WorkerSettings.redis_settings = WorkerSettings._get_redis_settings()


_init()
