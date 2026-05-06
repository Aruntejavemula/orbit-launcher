"""
ARQ worker — run with:
    arq worker.WorkerSettings
"""
import logging
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("orbit.worker")


async def send_otp_email_task(ctx, to_email: str, otp: str) -> None:
    from auth.email_otp import send_otp_email
    send_otp_email(to_email, otp)


class WorkerSettings:
    redis_settings = None  # set below
    functions = [send_otp_email_task]
    max_tries = 3
    job_timeout = 30

    @classmethod
    def _get_redis_settings(cls):
        from arq.connections import RedisSettings
        url = os.getenv("REDIS_URL", "redis://localhost:6379")
        return RedisSettings.from_dsn(url)


# Lazy-resolve so import works even without Redis installed during tests
def _init():
    WorkerSettings.redis_settings = WorkerSettings._get_redis_settings()


_init()
