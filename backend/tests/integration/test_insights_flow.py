"""
Integration tests for the /api/insights router.

Covers: spending, usage stats, renewals calendar.
"""
from datetime import datetime, timedelta, timezone

from models import AppItem, LaunchEvent, UsageSession
from tests.integration.conftest import seed_user, seed_app, make_auth_cookie


class TestSpending:
    async def test_returns_paid_apps_only(self, int_client, db_session):
        user = await seed_user(db_session)
        paid = await seed_app(db_session, user.id, slug="paid-app", plan="paid")
        await seed_app(db_session, user.id, slug="free-app", plan="free")
        await db_session.commit()

        resp = await int_client.get("/api/insights/spending", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["slug"] == "paid-app"

    async def test_excludes_deleted_paid_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        deleted = await seed_app(db_session, user.id, slug="deleted-paid", plan="paid")
        deleted.is_deleted = True
        await db_session.commit()

        resp = await int_client.get("/api/insights/spending", cookies=make_auth_cookie(user.id))
        assert resp.json() == []

    async def test_empty_when_no_paid_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.get("/api/insights/spending", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_response_includes_frequency_and_expires(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id, slug="paid-monthly", plan="paid")
        app.frequency = "monthly"
        app.expires_at = datetime(2025, 12, 31, tzinfo=timezone.utc)
        await db_session.commit()

        resp = await int_client.get("/api/insights/spending", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert data[0]["frequency"] == "monthly"
        assert data[0]["expires_at"] is not None

    async def test_unauthorized_returns_401(self, int_client, db_session):
        resp = await int_client.get("/api/insights/spending")
        assert resp.status_code == 401


class TestUsageStats:
    async def test_empty_when_no_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.get("/api/insights/usage", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_aggregates_launch_count(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        db_session.add(LaunchEvent(user_id=user.id, app_id=app.id))
        db_session.add(LaunchEvent(user_id=user.id, app_id=app.id))
        db_session.add(LaunchEvent(user_id=user.id, app_id=app.id))
        await db_session.commit()

        resp = await int_client.get("/api/insights/usage", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["launch_count"] == 3

    async def test_aggregates_usage_minutes(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        db_session.add(UsageSession(user_id=user.id, app_id=app.id, duration_minutes=30))
        db_session.add(UsageSession(user_id=user.id, app_id=app.id, duration_minutes=45))
        await db_session.commit()

        resp = await int_client.get("/api/insights/usage", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert data[0]["total_minutes"] == 75

    async def test_zero_usage_for_unlaunched_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_app(db_session, user.id)
        await db_session.commit()

        resp = await int_client.get("/api/insights/usage", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert data[0]["total_minutes"] == 0
        assert data[0]["launch_count"] == 0

    async def test_excludes_deleted_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        app.is_deleted = True
        await db_session.commit()

        resp = await int_client.get("/api/insights/usage", cookies=make_auth_cookie(user.id))
        assert resp.json() == []


class TestRenewals:
    async def test_returns_apps_expiring_within_30_days(self, int_client, db_session):
        user = await seed_user(db_session)
        soon = await seed_app(db_session, user.id, slug="soon", plan="paid")
        soon.expires_at = datetime.now(timezone.utc) + timedelta(days=10)

        far = await seed_app(db_session, user.id, slug="far", plan="paid")
        far.expires_at = datetime.now(timezone.utc) + timedelta(days=60)

        await db_session.commit()

        resp = await int_client.get("/api/insights/renewals", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["slug"] == "soon"

    async def test_excludes_apps_without_expiry(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_app(db_session, user.id, slug="no-expiry")
        await db_session.commit()

        resp = await int_client.get("/api/insights/renewals", cookies=make_auth_cookie(user.id))
        assert resp.json() == []

    async def test_days_until_calculated(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id, slug="expiring")
        app.expires_at = datetime.now(timezone.utc) + timedelta(days=15)
        await db_session.commit()

        resp = await int_client.get("/api/insights/renewals", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert data[0]["days_until"] >= 14

    async def test_ordered_by_expires_at(self, int_client, db_session):
        user = await seed_user(db_session)
        later = await seed_app(db_session, user.id, slug="later", plan="paid")
        later.expires_at = datetime.now(timezone.utc) + timedelta(days=20)
        sooner = await seed_app(db_session, user.id, slug="sooner", plan="paid")
        sooner.expires_at = datetime.now(timezone.utc) + timedelta(days=5)
        await db_session.commit()

        resp = await int_client.get("/api/insights/renewals", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert data[0]["slug"] == "sooner"
        assert data[1]["slug"] == "later"
