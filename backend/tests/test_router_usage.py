"""Tests for /api/usage router."""
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from tests.conftest import TEST_USER_ID


def _make_usage_session(
    app_id: uuid.UUID | None = None,
    duration_minutes: int = 30,
):
    session = MagicMock()
    session.app_id = app_id or uuid.uuid4()
    session.duration_minutes = duration_minutes
    session.recorded_at = datetime.now(timezone.utc)
    return session


@pytest.mark.asyncio
async def test_get_usage_returns_sessions(client, mock_db):
    row = _make_usage_session()
    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = [row]
    mock_db.execute = AsyncMock(return_value=result_mock)

    resp = await client.get("/api/usage")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["duration_minutes"] == 30


@pytest.mark.asyncio
async def test_log_usage_creates_session(client, mock_db):
    app_id = uuid.uuid4()
    created = _make_usage_session(app_id=app_id, duration_minutes=15)

    async def refresh_session(session):
        session.app_id = app_id
        session.duration_minutes = 15
        session.recorded_at = datetime.now(timezone.utc)

    mock_db.refresh = AsyncMock(side_effect=refresh_session)

    resp = await client.post(
        "/api/usage",
        json={"app_id": str(app_id), "duration_minutes": 15},
    )
    assert resp.status_code == 201
    assert resp.json()["duration_minutes"] == 15
    mock_db.add.assert_called_once()
    mock_db.commit.assert_awaited()
