"""
Integration tests for the /api/preferences router.

Covers: init (idempotent), get, patch flows against real SQLite DB.
"""
import pytest

from tests.integration.conftest import seed_user, seed_preferences, make_auth_cookie


class TestGetPreferences:
    async def test_returns_preferences(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_preferences(db_session, user.id)
        await db_session.commit()

        resp = await int_client.get("/api/preferences", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        data = resp.json()
        assert data["theme"] == "light"
        assert data["reminder_days"] == 7
        assert data["onboarding_completed"] is False

    async def test_returns_404_when_not_initialized(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.get("/api/preferences", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 404

    async def test_unauthorized_returns_401(self, int_client, db_session):
        resp = await int_client.get("/api/preferences")
        assert resp.status_code == 401


class TestInitPreferences:
    async def test_creates_default_preferences(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post("/api/preferences/init", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 201
        data = resp.json()
        assert data["theme"] == "light"
        assert data["reminder_days"] == 7
        assert data["onboarding_completed"] is False
        assert data["compact_cards"] is False

    async def test_idempotent_returns_existing(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_preferences(db_session, user.id)
        await db_session.commit()

        # Patch theme first
        await int_client.patch(
            "/api/preferences",
            json={"theme": "dark"},
            cookies=make_auth_cookie(user.id),
        )

        # Re-init should NOT reset to defaults
        resp = await int_client.post("/api/preferences/init", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 201
        assert resp.json()["theme"] == "dark"

    async def test_double_init_creates_one_row(self, int_client, db_session):
        from sqlalchemy import select
        from models import Preferences
        user = await seed_user(db_session)
        await db_session.commit()

        await int_client.post("/api/preferences/init", cookies=make_auth_cookie(user.id))
        await int_client.post("/api/preferences/init", cookies=make_auth_cookie(user.id))

        rows = (await db_session.execute(
            select(Preferences).where(Preferences.user_id == user.id)
        )).scalars().all()
        assert len(rows) == 1


class TestUpdatePreferences:
    async def test_patch_theme(self, int_client, db_session):
        user = await seed_user(db_session)
        prefs = await seed_preferences(db_session, user.id)
        await db_session.commit()

        resp = await int_client.patch(
            "/api/preferences",
            json={"theme": "dark"},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["theme"] == "dark"

        await db_session.refresh(prefs)
        assert prefs.theme.value == "dark"

    async def test_patch_multiple_fields(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_preferences(db_session, user.id)
        await db_session.commit()

        resp = await int_client.patch(
            "/api/preferences",
            json={"compact_cards": True, "show_last_opened": False, "reminder_days": 30},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["compact_cards"] is True
        assert data["show_last_opened"] is False
        assert data["reminder_days"] == 30

    async def test_partial_update_leaves_other_fields(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_preferences(db_session, user.id)
        await db_session.commit()

        await int_client.patch(
            "/api/preferences",
            json={"theme": "dark"},
            cookies=make_auth_cookie(user.id),
        )

        resp = await int_client.get("/api/preferences", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert data["theme"] == "dark"
        assert data["reminder_days"] == 7  # unchanged

    async def test_patch_creates_preferences_if_not_initialized(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.patch(
            "/api/preferences",
            json={"theme": "dark"},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["theme"] == "dark"

    @pytest.mark.parametrize("days,expected", [
        (0, 422),
        (366, 422),
        (-1, 422),
    ])
    async def test_invalid_reminder_days(self, int_client, db_session, days, expected):
        user = await seed_user(db_session)
        await seed_preferences(db_session, user.id)
        await db_session.commit()

        resp = await int_client.patch(
            "/api/preferences",
            json={"reminder_days": days},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == expected

    @pytest.mark.parametrize("days", [1, 7, 30, 90, 365])
    async def test_valid_reminder_days(self, int_client, db_session, days):
        user = await seed_user(db_session)
        await seed_preferences(db_session, user.id)
        await db_session.commit()

        resp = await int_client.patch(
            "/api/preferences",
            json={"reminder_days": days},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["reminder_days"] == days

    async def test_invalid_theme_returns_422(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_preferences(db_session, user.id)
        await db_session.commit()

        resp = await int_client.patch(
            "/api/preferences",
            json={"theme": "neon"},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 422
