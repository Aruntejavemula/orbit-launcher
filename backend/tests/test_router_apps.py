"""
Tests for the /api/apps router.

Tests cover: list, create, update, delete, reorder, and launch endpoints.
Uses hybrid style — table-driven for validation, individual functions for behavior.
"""
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.conftest import TEST_USER_ID, make_app


# ---------------------------------------------------------------------------
# GET /api/apps — list_apps
# ---------------------------------------------------------------------------


class TestListApps:
    async def test_returns_empty_list_when_no_apps(self, client, mock_db):
        """Returns [] when user has no apps."""
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = result_mock

        resp = await client.get("/api/apps")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_apps_ordered_by_display_order(self, client, mock_db):
        """Returns apps in display_order ascending."""
        app1 = make_app(name="First", display_order=0, slug="first")
        app2 = make_app(name="Second", display_order=1, slug="second")

        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = [app1, app2]
        mock_db.execute.return_value = result_mock

        resp = await client.get("/api/apps")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["name"] == "First"
        assert data[1]["name"] == "Second"

    async def test_excludes_deleted_apps(self, client, mock_db):
        """Only non-deleted apps should be returned."""
        # The route filters is_deleted in the query, so mock returns only active
        active_app = make_app(name="Active", is_deleted=False)
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = [active_app]
        mock_db.execute.return_value = result_mock

        resp = await client.get("/api/apps")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Active"


# ---------------------------------------------------------------------------
# POST /api/apps — create_app
# ---------------------------------------------------------------------------


class TestCreateApp:
    async def test_creates_app_with_valid_data(self, client, mock_db):
        """Valid payload returns 201 and the created app."""
        new_app = make_app(
            name="Claude",
            slug="claude",
            color="D97757",
            url="https://claude.ai",
            category="ai",
            plan="free",
            display_order=3,
        )

        # Mock: count query returns 3 existing apps
        count_result = MagicMock()
        count_result.scalar_one.return_value = 3
        mock_db.execute.return_value = count_result

        # refresh side_effect populates DB-generated fields on the object
        async def populate_on_refresh(obj):
            obj.id = uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)

        mock_db.refresh = AsyncMock(side_effect=populate_on_refresh)

        resp = await client.post("/api/apps", json={
            "name": "Claude",
            "slug": "claude",
            "color": "D97757",
            "url": "https://claude.ai",
            "category": "ai",
            "plan": "free",
        })

        # The route calls db.add, db.commit, db.refresh
        assert resp.status_code == 201
        mock_db.commit.assert_awaited_once()

    @pytest.mark.parametrize("payload,expected_status", [
        # Missing name
        (
            {"slug": "test", "color": "FF5733", "url": "https://example.com", "category": "ai"},
            422,
        ),
        # Bad color (not hex)
        (
            {"name": "App", "slug": "app", "color": "ZZZZZZ", "url": "https://example.com", "category": "ai"},
            422,
        ),
        # HTTP URL (must be https)
        (
            {"name": "App", "slug": "app", "color": "FF5733", "url": "http://insecure.com", "category": "ai"},
            422,
        ),
        # Missing slug
        (
            {"name": "App", "color": "FF5733", "url": "https://example.com", "category": "ai"},
            422,
        ),
        # Invalid category
        (
            {"name": "App", "slug": "app", "color": "FF5733", "url": "https://example.com", "category": "invalid"},
            422,
        ),
        # Slug with uppercase (pattern is ^[a-z0-9-]+$)
        (
            {"name": "App", "slug": "BadSlug", "color": "FF5733", "url": "https://example.com", "category": "ai"},
            422,
        ),
        # Name too long (>100 chars)
        (
            {"name": "A" * 101, "slug": "app", "color": "FF5733", "url": "https://example.com", "category": "ai"},
            422,
        ),
    ])
    async def test_invalid_inputs_return_422(self, client, mock_db, payload, expected_status):
        """Table-driven: invalid create payloads return 422."""
        resp = await client.post("/api/apps", json=payload)
        assert resp.status_code == expected_status

    async def test_sets_display_order_to_existing_count(self, client, mock_db):
        """display_order of new app = count of existing active apps."""
        count_result = MagicMock()
        count_result.scalar_one.return_value = 5
        mock_db.execute.return_value = count_result

        added_objects = []

        def capture_add(obj):
            added_objects.append(obj)

        mock_db.add = capture_add

        async def populate_on_refresh(obj):
            obj.id = uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)

        mock_db.refresh = AsyncMock(side_effect=populate_on_refresh)

        resp = await client.post("/api/apps", json={
            "name": "New App",
            "slug": "new-app",
            "color": "FF5733",
            "url": "https://example.com",
            "category": "productivity",
        })

        assert resp.status_code == 201
        # Verify the object added to DB has display_order=5
        assert len(added_objects) == 1
        assert added_objects[0].display_order == 5


# ---------------------------------------------------------------------------
# PATCH /api/apps/{id} — update_app
# ---------------------------------------------------------------------------


class TestUpdateApp:
    async def test_updates_fields_successfully(self, client, mock_db):
        """Successful partial update returns 200."""
        app_id = uuid.uuid4()
        existing_app = make_app(app_id=app_id, name="Old Name")

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing_app
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)

        resp = await client.patch(f"/api/apps/{app_id}", json={"name": "New Name"})
        assert resp.status_code == 200
        mock_db.commit.assert_awaited()

    async def test_returns_404_for_nonexistent_app(self, client, mock_db):
        """Non-existent app ID returns 404."""
        fake_id = uuid.uuid4()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = result_mock

        resp = await client.patch(f"/api/apps/{fake_id}", json={"name": "X"})
        assert resp.status_code == 404

    async def test_partial_update_only_changes_specified_fields(self, client, mock_db):
        """Only the fields in the payload are updated."""
        app_id = uuid.uuid4()
        existing_app = make_app(app_id=app_id, name="Original", color="AABBCC")

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing_app
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)

        resp = await client.patch(f"/api/apps/{app_id}", json={"name": "Updated"})
        assert resp.status_code == 200
        # The app color should remain unchanged (not reset)
        assert existing_app.color == "AABBCC"


# ---------------------------------------------------------------------------
# DELETE /api/apps/{id} — delete_app
# ---------------------------------------------------------------------------


class TestDeleteApp:
    async def test_soft_deletes_app(self, client, mock_db):
        """Marks is_deleted=True and sets deleted_at."""
        app_id = uuid.uuid4()
        existing_app = make_app(app_id=app_id, is_deleted=False)

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing_app
        mock_db.execute.return_value = result_mock

        resp = await client.delete(f"/api/apps/{app_id}")
        assert resp.status_code == 204
        assert existing_app.is_deleted is True
        assert existing_app.deleted_at is not None
        mock_db.commit.assert_awaited()

    async def test_returns_404_for_already_deleted_app(self, client, mock_db):
        """Already-deleted app returns 404 (filtered by _active_q)."""
        fake_id = uuid.uuid4()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = result_mock

        resp = await client.delete(f"/api/apps/{fake_id}")
        assert resp.status_code == 404

    async def test_returns_204_on_success(self, client, mock_db):
        """Successful delete returns 204 No Content."""
        app_id = uuid.uuid4()
        existing_app = make_app(app_id=app_id)

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing_app
        mock_db.execute.return_value = result_mock

        resp = await client.delete(f"/api/apps/{app_id}")
        assert resp.status_code == 204
        assert resp.content == b""


# ---------------------------------------------------------------------------
# POST /api/apps/reorder — reorder_apps
# ---------------------------------------------------------------------------


class TestReorderApps:
    async def test_updates_display_order_for_all_items(self, client, mock_db):
        """Reorder updates display_order for each item."""
        id1, id2 = uuid.uuid4(), uuid.uuid4()

        # First call: select existing IDs
        select_result = MagicMock()
        select_result.all.return_value = [(id1,), (id2,)]

        # Track multiple execute calls
        mock_db.execute = AsyncMock(return_value=select_result)

        resp = await client.post("/api/apps/reorder", json=[
            {"id": str(id1), "order": 1},
            {"id": str(id2), "order": 0},
        ])
        assert resp.status_code == 204
        mock_db.commit.assert_awaited()

    async def test_rejects_duplicate_ids(self, client, mock_db):
        """Duplicate IDs in payload returns 400."""
        dup_id = str(uuid.uuid4())

        resp = await client.post("/api/apps/reorder", json=[
            {"id": dup_id, "order": 0},
            {"id": dup_id, "order": 1},
        ])
        assert resp.status_code == 400
        assert "Duplicate" in resp.json()["detail"]

    async def test_rejects_nonexistent_ids(self, client, mock_db):
        """IDs not in DB returns 400."""
        id1 = uuid.uuid4()
        id_missing = uuid.uuid4()

        # Return only id1 as existing
        select_result = MagicMock()
        select_result.all.return_value = [(id1,)]
        mock_db.execute.return_value = select_result

        resp = await client.post("/api/apps/reorder", json=[
            {"id": str(id1), "order": 0},
            {"id": str(id_missing), "order": 1},
        ])
        assert resp.status_code == 400
        assert "could not be found" in resp.json()["detail"]

    async def test_empty_list_is_noop(self, client, mock_db):
        """Empty reorder list does nothing and returns 204."""
        resp = await client.post("/api/apps/reorder", json=[])
        assert resp.status_code == 204
        mock_db.commit.assert_not_awaited()


# ---------------------------------------------------------------------------
# POST /api/apps/{id}/launch — launch_app
# ---------------------------------------------------------------------------


class TestLaunchApp:
    async def test_creates_launch_event(self, client, mock_db):
        """Launching an app creates a LaunchEvent and updates last_opened_at."""
        app_id = uuid.uuid4()
        existing_app = make_app(app_id=app_id, last_opened_at=None)

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing_app
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)

        added_objects = []
        mock_db.add = lambda obj: added_objects.append(obj)

        resp = await client.post(f"/api/apps/{app_id}/launch")
        assert resp.status_code == 200
        # last_opened_at should be set
        assert existing_app.last_opened_at is not None
        # A LaunchEvent was added
        assert len(added_objects) == 1
        mock_db.commit.assert_awaited()

    async def test_updates_last_opened_at(self, client, mock_db):
        """last_opened_at is updated to current time on launch."""
        app_id = uuid.uuid4()
        old_time = datetime(2024, 1, 1, tzinfo=timezone.utc)
        existing_app = make_app(app_id=app_id, last_opened_at=old_time)

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing_app
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)
        mock_db.add = MagicMock()

        resp = await client.post(f"/api/apps/{app_id}/launch")
        assert resp.status_code == 200
        # last_opened_at should be newer than old_time
        assert existing_app.last_opened_at != old_time

    async def test_returns_updated_app(self, client, mock_db):
        """Response includes the app data."""
        app_id = uuid.uuid4()
        existing_app = make_app(app_id=app_id, name="LaunchMe")

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing_app
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)
        mock_db.add = MagicMock()

        resp = await client.post(f"/api/apps/{app_id}/launch")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "LaunchMe"

    async def test_returns_404_for_nonexistent_app(self, client, mock_db):
        """Launching a non-existent app returns 404."""
        fake_id = uuid.uuid4()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = result_mock

        resp = await client.post(f"/api/apps/{fake_id}/launch")
        assert resp.status_code == 404
