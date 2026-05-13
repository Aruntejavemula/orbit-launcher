"""
Tests for the /api/launches router.

Covers: listing launches and purging old entries.
"""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from tests.conftest import TEST_USER_ID, make_launch


# ---------------------------------------------------------------------------
# GET /api/launches
# ---------------------------------------------------------------------------


class TestGetLaunches:
    async def test_returns_launches_ordered_by_launched_at_desc(self, client, mock_db):
        """Returns launches in reverse chronological order."""
        now = datetime.now(timezone.utc)
        launch1 = make_launch(launched_at=now - timedelta(hours=2))
        launch2 = make_launch(launched_at=now - timedelta(hours=1))
        launch3 = make_launch(launched_at=now)

        # Router orders desc, so mock returns newest first
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = [launch3, launch2, launch1]
        mock_db.execute.return_value = result_mock

        resp = await client.get("/api/launches")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        # Verify ordering: first item should be newest
        assert data[0]["launched_at"] >= data[1]["launched_at"]
        assert data[1]["launched_at"] >= data[2]["launched_at"]

    async def test_returns_empty_list_when_no_launches(self, client, mock_db):
        """No launches returns empty list."""
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = result_mock

        resp = await client.get("/api/launches")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_limits_to_200(self, client, mock_db):
        """At most 200 launches are returned (enforced by query LIMIT)."""
        # Create 200 launches
        launches = [make_launch() for _ in range(200)]
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = launches
        mock_db.execute.return_value = result_mock

        resp = await client.get("/api/launches")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 200

    async def test_response_includes_app_id_and_launched_at(self, client, mock_db):
        """Each launch entry has app_id and launched_at fields."""
        app_id = uuid.uuid4()
        launch = make_launch(app_id=app_id)

        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = [launch]
        mock_db.execute.return_value = result_mock

        resp = await client.get("/api/launches")
        assert resp.status_code == 200
        data = resp.json()
        assert "app_id" in data[0]
        assert "launched_at" in data[0]
        assert data[0]["app_id"] == str(app_id)


# ---------------------------------------------------------------------------
# DELETE /api/launches/purge-old
# ---------------------------------------------------------------------------


class TestPurgeOldLaunches:
    async def test_deletes_launches_older_than_90_days(self, client, mock_db):
        """Purge removes entries older than 90 days and returns count."""
        # Mock: delete returns 5 rows
        delete_result = MagicMock()
        delete_result.fetchall.return_value = [
            (uuid.uuid4(),) for _ in range(5)
        ]
        mock_db.execute.return_value = delete_result

        resp = await client.delete("/api/launches/purge-old")
        assert resp.status_code == 200
        data = resp.json()
        assert data["deleted"] == 5
        assert "cutoff" in data
        mock_db.commit.assert_awaited()

    async def test_returns_cutoff_datetime(self, client, mock_db):
        """Response includes the cutoff ISO datetime."""
        delete_result = MagicMock()
        delete_result.fetchall.return_value = []
        mock_db.execute.return_value = delete_result

        resp = await client.delete("/api/launches/purge-old")
        assert resp.status_code == 200
        data = resp.json()
        # cutoff should be a valid ISO datetime string
        cutoff = datetime.fromisoformat(data["cutoff"])
        assert cutoff < datetime.now(timezone.utc)
        # cutoff should be approximately 90 days ago
        expected_cutoff = datetime.now(timezone.utc) - timedelta(days=90)
        assert abs((cutoff - expected_cutoff).total_seconds()) < 5

    async def test_no_error_when_nothing_to_purge(self, client, mock_db):
        """Purge with nothing old returns deleted=0 without error."""
        delete_result = MagicMock()
        delete_result.fetchall.return_value = []
        mock_db.execute.return_value = delete_result

        resp = await client.delete("/api/launches/purge-old")
        assert resp.status_code == 200
        data = resp.json()
        assert data["deleted"] == 0
        mock_db.commit.assert_awaited()
