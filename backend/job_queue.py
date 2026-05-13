"""
Thin wrapper around the ARQ Redis pool.
Usage:
    await enqueue_send_otp("user@example.com", "123456")
"""
import asyncio
import logging
import os
import time

logger = logging.getLogger("orbit.queue")

_pool = None
_redis_dead_until: float = 0  # epoch seconds — skip retries until this time
_DEAD_BACKOFF = 30.0  # seconds to skip retries after a failure


async def get_queue_pool():
    global _pool
    if _pool is None:
        from arq import create_pool
        from arq.connections import RedisSettings
        url = os.getenv("REDIS_URL", "redis://localhost:6379")
        # 1 retry, 1s timeout — fail fast, don't block request threads
        settings = RedisSettings.from_dsn(url)
        settings.conn_retries = 1
        settings.conn_timeout = 1
        _pool = await create_pool(settings)
    return _pool


async def close_queue_pool():
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None


async def enqueue_send_otp(to_email: str, otp: str) -> bool:
    """Enqueue OTP email. Returns True if queued, False on Redis failure (caller sends inline)."""
    global _pool, _redis_dead_until

    # Fast-path: Redis known dead — don't even try
    if time.monotonic() < _redis_dead_until:
        logger.warning("Redis marked dead, skipping enqueue for %s", to_email)
        return False

    try:
        pool = await asyncio.wait_for(get_queue_pool(), timeout=2.0)
        await asyncio.wait_for(
            pool.enqueue_job("send_otp_email_task", to_email, otp),
            timeout=2.0,
        )
        logger.info("OTP email job enqueued for %s", to_email)
        return True
    except Exception as exc:
        logger.error("Failed to enqueue OTP email for %s: %s", to_email, exc)
        # Mark Redis dead and reset pool so next attempt creates fresh connection
        _redis_dead_until = time.monotonic() + _DEAD_BACKOFF
        _pool = None
        return False
