"""Health endpoint coverage."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from tests.conftest import TEST_USER_ID, make_user


@pytest.mark.asyncio
async def test_health_db_ok_redis_unreachable(client, mock_db):
    mock_db.execute = AsyncMock()
    with patch("job_queue.get_queue_pool", side_effect=ConnectionError("redis down")):
        resp = await client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["db"] == "reachable"
    assert body["redis"] == "unreachable"


@pytest.mark.asyncio
async def test_health_db_unreachable(client, mock_db):
    mock_db.execute = AsyncMock(side_effect=RuntimeError("db down"))
    with patch("job_queue.get_queue_pool", side_effect=ConnectionError("redis down")):
        resp = await client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "degraded"
    assert body["db"] == "unreachable"


@pytest.mark.asyncio
async def test_health_redis_ok(client, mock_db):
    mock_db.execute = AsyncMock()
    pool = AsyncMock()
    pool.ping = AsyncMock()
    with patch("job_queue.get_queue_pool", return_value=pool):
        resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["redis"] == "reachable"


@pytest.mark.asyncio
async def test_desktop_session_sets_cookie(client, mock_db):
    from routers.auth import _create_desktop_exchange_code

    user = make_user(user_id=TEST_USER_ID)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = user
    mock_db.execute = AsyncMock(return_value=result_mock)

    code = _create_desktop_exchange_code(TEST_USER_ID, remember=True)
    resp = await client.post("/api/auth/desktop/session", json={"code": code})
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
    assert body.get("access_token")
    assert "orbit_session" in resp.cookies
