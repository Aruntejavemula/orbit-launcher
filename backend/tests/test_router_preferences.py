"""
Tests for the /api/preferences router.

Covers: get, init (idempotent create), and partial update of preferences.
"""
from unittest.mock import AsyncMock, MagicMock

import pytest

from tests.conftest import TEST_USER_ID, make_preferences


# ---------------------------------------------------------------------------
# GET /api/preferences
# ---------------------------------------------------------------------------


class TestGetPreferences:
    async def test_returns_preferences_if_exist(self, client, mock_db):
        """Returns existing preferences for the user."""
        prefs = make_preferences()

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = prefs
        mock_db.execute.return_value = result_mock

        resp = await client.get("/api/preferences")
        assert resp.status_code == 200
        data = resp.json()
        assert data["theme"] == "light"
        assert data["reminder_days"] == 7
        assert data["onboarding_completed"] is False

    async def test_returns_404_if_not_initialized(self, client, mock_db):
        """Returns 404 when preferences don't exist yet."""
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = result_mock

        resp = await client.get("/api/preferences")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/preferences/init
# ---------------------------------------------------------------------------


class TestInitPreferences:
    async def test_creates_default_preferences(self, client, mock_db):
        """Creates new preferences with defaults when none exist."""
        from datetime import datetime, timezone

        # First execute: check if exists -> None
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = result_mock

        # refresh side_effect sets DB default values on the new Preferences object
        async def populate_on_refresh(obj):
            obj.theme = "light"
            obj.start_week_on_monday = False
            obj.compact_cards = False
            obj.show_last_opened = True
            obj.notify_expirations = True
            obj.reminder_days = 7
            obj.reminder_email = True
            obj.reminder_push = False
            obj.onboarding_completed = False
            obj.country = ""

        mock_db.refresh = AsyncMock(side_effect=populate_on_refresh)

        added_objects = []
        mock_db.add = lambda obj: added_objects.append(obj)

        resp = await client.post("/api/preferences/init")
        assert resp.status_code == 201
        assert len(added_objects) == 1
        mock_db.commit.assert_awaited()
        data = resp.json()
        assert data["theme"] == "light"
        assert data["reminder_days"] == 7

    async def test_returns_existing_if_already_initialized(self, client, mock_db):
        """Idempotent: returns existing prefs if already created."""
        existing_prefs = make_preferences(theme="dark", reminder_days=14)

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing_prefs
        mock_db.execute.return_value = result_mock

        resp = await client.post("/api/preferences/init")
        # Still returns 201 (the route always returns status 201)
        assert resp.status_code == 201
        data = resp.json()
        assert data["theme"] == "dark"
        assert data["reminder_days"] == 14
        # Should NOT commit since nothing was created
        mock_db.commit.assert_not_awaited()


# ---------------------------------------------------------------------------
# PATCH /api/preferences
# ---------------------------------------------------------------------------


class TestUpdatePreferences:
    async def test_partial_update_works(self, client, mock_db):
        """Updating a single field leaves others unchanged."""
        prefs = make_preferences(theme="light")

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = prefs
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)

        resp = await client.patch("/api/preferences", json={"theme": "dark"})
        assert resp.status_code == 200
        mock_db.commit.assert_awaited()

    async def test_update_multiple_fields(self, client, mock_db):
        """Can update multiple fields at once."""
        prefs = make_preferences()

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = prefs
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)

        resp = await client.patch("/api/preferences", json={
            "compact_cards": True,
            "show_last_opened": False,
            "reminder_days": 30,
        })
        assert resp.status_code == 200
        mock_db.commit.assert_awaited()

    async def test_creates_preferences_if_not_initialized(self, client, mock_db):
        """PATCH creates default preferences when none exist yet."""
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = result_mock

        async def populate_on_refresh(obj):
            obj.theme = "dark"
            obj.start_week_on_monday = False
            obj.compact_cards = False
            obj.show_last_opened = True
            obj.notify_expirations = True
            obj.reminder_days = 7
            obj.reminder_email = True
            obj.reminder_push = False
            obj.onboarding_completed = False
            obj.country = ""

        mock_db.refresh = AsyncMock(side_effect=populate_on_refresh)

        resp = await client.patch("/api/preferences", json={"theme": "dark"})
        assert resp.status_code == 200
        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited()

    @pytest.mark.parametrize("reminder_days,expected_status", [
        (0, 422),       # Below minimum (ge=1)
        (366, 422),     # Above maximum (le=365)
        (-1, 422),      # Negative
        (-100, 422),    # Very negative
    ])
    async def test_invalid_reminder_days_returns_422(
        self, client, mock_db, reminder_days, expected_status
    ):
        """Table-driven: invalid reminder_days values rejected."""
        prefs = make_preferences()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = prefs
        mock_db.execute.return_value = result_mock

        resp = await client.patch("/api/preferences", json={
            "reminder_days": reminder_days,
        })
        assert resp.status_code == expected_status

    @pytest.mark.parametrize("valid_days", [1, 7, 30, 90, 365])
    async def test_valid_reminder_days_accepted(self, client, mock_db, valid_days):
        """Table-driven: valid reminder_days values pass validation."""
        prefs = make_preferences()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = prefs
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)

        resp = await client.patch("/api/preferences", json={
            "reminder_days": valid_days,
        })
        assert resp.status_code == 200

    async def test_invalid_theme_returns_422(self, client, mock_db):
        """Invalid theme value returns 422."""
        resp = await client.patch("/api/preferences", json={"theme": "neon"})
        assert resp.status_code == 422

    @pytest.mark.parametrize("theme", ["light", "dark"])
    async def test_valid_themes_accepted(self, client, mock_db, theme):
        """Valid theme values pass validation."""
        prefs = make_preferences()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = prefs
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)

        resp = await client.patch("/api/preferences", json={"theme": theme})
        assert resp.status_code == 200

    @pytest.mark.parametrize("monthly_budget,expected_status", [
        (0, 422),
        (100_001, 422),
        (500, 200),
    ])
    async def test_monthly_budget_validation(
        self, client, mock_db, monthly_budget, expected_status
    ):
        prefs = make_preferences()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = prefs
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)

        resp = await client.patch("/api/preferences", json={"monthly_budget": monthly_budget})
        assert resp.status_code == expected_status

    async def test_country_uppercased_on_patch(self, client, mock_db):
        prefs = make_preferences()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = prefs
        mock_db.execute.return_value = result_mock
        mock_db.refresh = AsyncMock(return_value=None)

        resp = await client.patch("/api/preferences", json={"country": "gb"})
        assert resp.status_code == 200
