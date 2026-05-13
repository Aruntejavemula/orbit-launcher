"""
Integration tests for the /api/activity router.

Covers: activity status computation (green/yellow/red), ordering, edge cases.
"""
from datetime import datetime, timedelta, timezone

from tests.integration.conftest import seed_user, seed_app, make_auth_cookie


class TestActivityList:
    async def test_empty_when_no_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.get("/api/activity", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_green_status_for_recently_used_app(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id, slug="slack")
        app.last_opened_at = datetime.now(timezone.utc) - timedelta(days=2)
        await db_session.commit()

        resp = await int_client.get("/api/activity", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["status"] == "green"

    async def test_yellow_status_for_week_old_app(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id, slug="figma")
        app.last_opened_at = datetime.now(timezone.utc) - timedelta(days=10)
        await db_session.commit()

        resp = await int_client.get("/api/activity", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["status"] == "yellow"
        assert "10 days" in data[0]["message"]

    async def test_red_status_for_15_day_old_app(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id, slug="notion")
        app.last_opened_at = datetime.now(timezone.utc) - timedelta(days=20)
        await db_session.commit()

        resp = await int_client.get("/api/activity", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["status"] == "red"
        assert "unsubscribing" in data[0]["message"].lower()

    async def test_red_status_for_never_opened_app(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_app(db_session, user.id, slug="unused")
        await db_session.commit()

        resp = await int_client.get("/api/activity", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["status"] == "red"

    async def test_excludes_deleted_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id, slug="deleted-app")
        app.is_deleted = True
        await db_session.commit()

        resp = await int_client.get("/api/activity", cookies=make_auth_cookie(user.id))
        assert resp.json() == []

    async def test_multiple_statuses(self, int_client, db_session):
        user = await seed_user(db_session)
        now = datetime.now(timezone.utc)

        green = await seed_app(db_session, user.id, slug="green-app")
        green.last_opened_at = now - timedelta(days=1)

        yellow = await seed_app(db_session, user.id, slug="yellow-app")
        yellow.last_opened_at = now - timedelta(days=10)

        red = await seed_app(db_session, user.id, slug="red-app")
        red.last_opened_at = now - timedelta(days=20)

        await db_session.commit()

        resp = await int_client.get("/api/activity", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert len(data) == 3
        statuses = {e["slug"]: e["status"] for e in data}
        assert statuses["green-app"] == "green"
        assert statuses["yellow-app"] == "yellow"
        assert statuses["red-app"] == "red"

    async def test_unauthorized_returns_401(self, int_client, db_session):
        resp = await int_client.get("/api/activity")
        assert resp.status_code == 401
