"""
Integration tests for the /api/launches router.

Covers: list launches, purge old launches.
"""
from datetime import datetime, timedelta, timezone

from models import LaunchEvent
from models.launch_event import RETENTION_DAYS
from tests.integration.conftest import seed_user, seed_app, make_auth_cookie
from sqlalchemy import select


class TestGetLaunches:
    async def test_empty_when_no_launches(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.get("/api/launches", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_launches_for_user(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        event = LaunchEvent(user_id=user.id, app_id=app.id)
        db_session.add(event)
        await db_session.commit()

        resp = await int_client.get("/api/launches", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["app_id"] == str(app.id)

    async def test_returns_only_own_launches(self, int_client, db_session):
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        app1 = await seed_app(db_session, user1.id, slug="app1")
        app2 = await seed_app(db_session, user2.id, slug="app2")

        db_session.add(LaunchEvent(user_id=user1.id, app_id=app1.id))
        db_session.add(LaunchEvent(user_id=user2.id, app_id=app2.id))
        await db_session.commit()

        resp = await int_client.get("/api/launches", cookies=make_auth_cookie(user1.id))
        assert len(resp.json()) == 1

    async def test_launches_ordered_newest_first(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)

        old = LaunchEvent(
            user_id=user.id,
            app_id=app.id,
            launched_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
        )
        new = LaunchEvent(
            user_id=user.id,
            app_id=app.id,
            launched_at=datetime(2025, 6, 1, tzinfo=timezone.utc),
        )
        db_session.add(old)
        db_session.add(new)
        await db_session.commit()

        resp = await int_client.get("/api/launches", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert data[0]["launched_at"] > data[1]["launched_at"]

    async def test_unauthorized_returns_401(self, int_client, db_session):
        resp = await int_client.get("/api/launches")
        assert resp.status_code == 401


class TestPurgeOldLaunches:
    async def test_purges_events_older_than_retention(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)

        old_date = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS + 10)
        recent_date = datetime.now(timezone.utc) - timedelta(days=1)

        old_event = LaunchEvent(user_id=user.id, app_id=app.id, launched_at=old_date)
        recent_event = LaunchEvent(user_id=user.id, app_id=app.id, launched_at=recent_date)
        db_session.add(old_event)
        db_session.add(recent_event)
        await db_session.commit()

        resp = await int_client.delete(
            "/api/launches/purge-old",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["deleted"] == 1

        remaining = (await db_session.execute(
            select(LaunchEvent).where(LaunchEvent.user_id == user.id)
        )).scalars().all()
        assert len(remaining) == 1

    async def test_purge_noop_when_all_recent(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)

        recent = LaunchEvent(
            user_id=user.id,
            app_id=app.id,
            launched_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        db_session.add(recent)
        await db_session.commit()

        resp = await int_client.delete(
            "/api/launches/purge-old",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] == 0

    async def test_purge_only_own_events(self, int_client, db_session):
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        app1 = await seed_app(db_session, user1.id, slug="app1")
        app2 = await seed_app(db_session, user2.id, slug="app2")

        old = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS + 10)
        db_session.add(LaunchEvent(user_id=user1.id, app_id=app1.id, launched_at=old))
        db_session.add(LaunchEvent(user_id=user2.id, app_id=app2.id, launched_at=old))
        await db_session.commit()

        # User1 purges — only their old event deleted
        await int_client.delete("/api/launches/purge-old", cookies=make_auth_cookie(user1.id))

        remaining_u2 = (await db_session.execute(
            select(LaunchEvent).where(LaunchEvent.user_id == user2.id)
        )).scalars().all()
        assert len(remaining_u2) == 1
