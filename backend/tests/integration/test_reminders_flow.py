"""
Integration tests for the /api/reminders router.

Covers: create, list, toggle active, update fields, delete.
"""
import pytest

from tests.integration.conftest import seed_user, seed_app, seed_reminder, make_auth_cookie


class TestListReminders:
    async def test_empty_when_no_reminders(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.get("/api/reminders", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_own_reminders_only(self, int_client, db_session):
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        app1 = await seed_app(db_session, user1.id, slug="app1")
        app2 = await seed_app(db_session, user2.id, slug="app2")
        await seed_reminder(db_session, user1.id, app1.id)
        await seed_reminder(db_session, user2.id, app2.id)
        await db_session.commit()

        resp = await int_client.get("/api/reminders", cookies=make_auth_cookie(user1.id))
        assert len(resp.json()) == 1


class TestCreateReminder:
    async def test_creates_reminder(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        await db_session.commit()

        resp = await int_client.post("/api/reminders", json={
            "app_id": str(app.id),
            "remind_days_before": 14,
            "method": "email",
        }, cookies=make_auth_cookie(user.id))

        assert resp.status_code == 201
        data = resp.json()
        assert data["remind_days_before"] == 14
        assert data["method"] == "email"
        assert data["active"] is True

    async def test_defaults_applied(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        await db_session.commit()

        resp = await int_client.post("/api/reminders", json={
            "app_id": str(app.id),
        }, cookies=make_auth_cookie(user.id))

        assert resp.status_code == 201
        assert resp.json()["remind_days_before"] == 7

    async def test_requires_valid_app(self, int_client, db_session):
        import uuid
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post("/api/reminders", json={
            "app_id": str(uuid.uuid4()),
        }, cookies=make_auth_cookie(user.id))
        assert resp.status_code == 404

    async def test_cannot_add_reminder_to_other_users_app(self, int_client, db_session):
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        app = await seed_app(db_session, user1.id)
        await db_session.commit()

        resp = await int_client.post("/api/reminders", json={
            "app_id": str(app.id),
        }, cookies=make_auth_cookie(user2.id))
        assert resp.status_code == 404

    @pytest.mark.parametrize("days,expected", [
        (0, 422),
        (366, 422),
        (-5, 422),
    ])
    async def test_invalid_remind_days(self, int_client, db_session, days, expected):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        await db_session.commit()

        resp = await int_client.post("/api/reminders", json={
            "app_id": str(app.id),
            "remind_days_before": days,
        }, cookies=make_auth_cookie(user.id))
        assert resp.status_code == expected


class TestUpdateReminder:
    async def test_toggle_active_false(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        reminder = await seed_reminder(db_session, user.id, app.id)
        await db_session.commit()

        resp = await int_client.patch(
            f"/api/reminders/{reminder.id}",
            json={"active": False},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["active"] is False

        await db_session.refresh(reminder)
        assert reminder.active is False

    async def test_update_method(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        reminder = await seed_reminder(db_session, user.id, app.id, method="email")
        await db_session.commit()

        resp = await int_client.patch(
            f"/api/reminders/{reminder.id}",
            json={"method": "push"},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["method"] == "push"

    async def test_returns_404_for_nonexistent(self, int_client, db_session):
        import uuid
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.patch(
            f"/api/reminders/{uuid.uuid4()}",
            json={"active": False},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 404

    async def test_cannot_update_other_users_reminder(self, int_client, db_session):
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        app = await seed_app(db_session, user1.id)
        reminder = await seed_reminder(db_session, user1.id, app.id)
        await db_session.commit()

        resp = await int_client.patch(
            f"/api/reminders/{reminder.id}",
            json={"active": False},
            cookies=make_auth_cookie(user2.id),
        )
        assert resp.status_code == 404


class TestDeleteReminder:
    async def test_deletes_reminder(self, int_client, db_session):
        from sqlalchemy import select
        from models import Reminder
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        reminder = await seed_reminder(db_session, user.id, app.id)
        await db_session.commit()

        resp = await int_client.delete(
            f"/api/reminders/{reminder.id}",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 204

        row = (await db_session.execute(
            select(Reminder).where(Reminder.id == reminder.id)
        )).scalar_one_or_none()
        assert row is None

    async def test_returns_404_for_already_deleted(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        reminder = await seed_reminder(db_session, user.id, app.id)
        await db_session.commit()

        await int_client.delete(
            f"/api/reminders/{reminder.id}",
            cookies=make_auth_cookie(user.id),
        )
        resp = await int_client.delete(
            f"/api/reminders/{reminder.id}",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 404

    async def test_cannot_delete_other_users_reminder(self, int_client, db_session):
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        app = await seed_app(db_session, user1.id)
        reminder = await seed_reminder(db_session, user1.id, app.id)
        await db_session.commit()

        resp = await int_client.delete(
            f"/api/reminders/{reminder.id}",
            cookies=make_auth_cookie(user2.id),
        )
        assert resp.status_code == 404
