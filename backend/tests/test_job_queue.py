"""job_queue enqueue and pool helpers."""
import time
from unittest.mock import AsyncMock, patch

import pytest

import job_queue


@pytest.fixture(autouse=True)
def reset_queue_state():
    job_queue._pool = None
    job_queue._redis_dead_until = 0
    yield
    job_queue._pool = None
    job_queue._redis_dead_until = 0


@pytest.mark.asyncio
async def test_enqueue_send_otp_success():
    pool = AsyncMock()
    pool.enqueue_job = AsyncMock()
    with patch("job_queue.get_queue_pool", return_value=pool):
        ok = await job_queue.enqueue_send_otp("a@b.com", "123456")
    assert ok is True
    pool.enqueue_job.assert_awaited_once()


@pytest.mark.asyncio
async def test_enqueue_send_otp_skips_when_redis_marked_dead():
    job_queue._redis_dead_until = time.monotonic() + 60
    ok = await job_queue.enqueue_send_otp("a@b.com", "123456")
    assert ok is False


@pytest.mark.asyncio
async def test_enqueue_send_otp_failure_marks_redis_dead():
    with patch("job_queue.get_queue_pool", side_effect=TimeoutError("slow")):
        ok = await job_queue.enqueue_send_otp("a@b.com", "999999")
    assert ok is False
    assert job_queue._redis_dead_until > time.monotonic()


@pytest.mark.asyncio
async def test_close_queue_pool():
    pool = AsyncMock()
    job_queue._pool = pool
    await job_queue.close_queue_pool()
    assert job_queue._pool is None
    pool.aclose.assert_awaited_once()
