"""
Integration tests for the /api/apps router.

Full create → list → update → reorder → delete cycle against real SQLite DB.
"""
import pytest
from sqlalchemy import select

from models import AppItem
from tests.integration.conftest import seed_user, seed_app, make_auth_cookie


class TestListApps:
    async def test_empty_list_when_no_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.get("/api/apps", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_apps_in_display_order(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_app(db_session, user.id, name="B", slug="b-app", display_order=1)
        await seed_app(db_session, user.id, name="A", slug="a-app", display_order=0)
        await db_session.commit()

        resp = await int_client.get("/api/apps", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["name"] == "A"
        assert data[1]["name"] == "B"

    async def test_excludes_deleted_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        active = await seed_app(db_session, user.id, name="Active", slug="active")
        deleted = await seed_app(db_session, user.id, name="Deleted", slug="deleted")
        deleted.is_deleted = True
        await db_session.commit()

        resp = await int_client.get("/api/apps", cookies=make_auth_cookie(user.id))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Active"

    async def test_returns_only_own_apps(self, int_client, db_session):
        from tests.integration.conftest import seed_user as _seed
        user1 = await _seed(db_session, email="user1@example.com")
        user2 = await _seed(db_session, email="user2@example.com")
        await seed_app(db_session, user1.id, slug="u1-app")
        await seed_app(db_session, user2.id, slug="u2-app")
        await db_session.commit()

        resp = await int_client.get("/api/apps", cookies=make_auth_cookie(user1.id))
        assert len(resp.json()) == 1

    async def test_unauthorized_returns_401(self, int_client, db_session):
        resp = await int_client.get("/api/apps")
        assert resp.status_code == 401


class TestCreateApp:
    async def test_creates_app_successfully(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post("/api/apps", json={
            "name": "Claude",
            "slug": "claude",
            "color": "D97757",
            "url": "https://claude.ai",
            "category": "ai",
        }, cookies=make_auth_cookie(user.id))

        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Claude"
        assert data["slug"] == "claude"

    async def test_app_persisted_in_db(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        await int_client.post("/api/apps", json={
            "name": "Notion",
            "slug": "notion",
            "color": "000000",
            "url": "https://notion.so",
            "category": "productivity",
        }, cookies=make_auth_cookie(user.id))

        app = (await db_session.execute(select(AppItem).where(AppItem.slug == "notion"))).scalar_one_or_none()
        assert app is not None
        assert app.name == "Notion"

    async def test_display_order_assigned_from_count(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_app(db_session, user.id, slug="existing")
        await db_session.commit()

        resp = await int_client.post("/api/apps", json={
            "name": "Second",
            "slug": "second",
            "color": "FF5733",
            "url": "https://example.com",
            "category": "productivity",
        }, cookies=make_auth_cookie(user.id))
        assert resp.status_code == 201
        assert resp.json()["display_order"] == 1

    @pytest.mark.parametrize("payload,expected", [
        ({"name": "X", "slug": "x", "color": "ZZZZZZ", "url": "https://x.com", "category": "ai"}, 422),
        ({"name": "X", "slug": "x", "color": "FF5733", "url": "http://insecure.com", "category": "ai"}, 422),
        ({"name": "X", "slug": "BAD_SLUG", "color": "FF5733", "url": "https://x.com", "category": "ai"}, 422),
        ({"name": "X", "slug": "x", "color": "FF5733", "url": "https://x.com", "category": "invalid"}, 422),
        ({"name": "A" * 101, "slug": "x", "color": "FF5733", "url": "https://x.com", "category": "ai"}, 422),
    ])
    async def test_invalid_payload_rejected(self, int_client, db_session, payload, expected):
        user = await seed_user(db_session)
        await db_session.commit()
        resp = await int_client.post("/api/apps", json=payload, cookies=make_auth_cookie(user.id))
        assert resp.status_code == expected


class TestUpdateApp:
    async def test_update_name(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id, name="Old")
        await db_session.commit()

        resp = await int_client.patch(
            f"/api/apps/{app.id}",
            json={"name": "New"},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "New"

    async def test_update_persists_to_db(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id, name="Old")
        await db_session.commit()

        await int_client.patch(
            f"/api/apps/{app.id}",
            json={"name": "Persisted"},
            cookies=make_auth_cookie(user.id),
        )

        await db_session.refresh(app)
        assert app.name == "Persisted"

    async def test_partial_update_leaves_other_fields(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id, name="Keep", color="AABBCC")
        await db_session.commit()

        resp = await int_client.patch(
            f"/api/apps/{app.id}",
            json={"name": "Changed"},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["color"] == "AABBCC"

    async def test_returns_404_for_nonexistent(self, int_client, db_session):
        import uuid
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.patch(
            f"/api/apps/{uuid.uuid4()}",
            json={"name": "X"},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 404

    async def test_cannot_update_other_users_app(self, int_client, db_session):
        import uuid
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        app = await seed_app(db_session, user1.id)
        await db_session.commit()

        resp = await int_client.patch(
            f"/api/apps/{app.id}",
            json={"name": "Stolen"},
            cookies=make_auth_cookie(user2.id),
        )
        assert resp.status_code == 404


class TestDeleteApp:
    async def test_soft_deletes_app(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        await db_session.commit()

        resp = await int_client.delete(
            f"/api/apps/{app.id}",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 204

        await db_session.refresh(app)
        assert app.is_deleted is True
        assert app.deleted_at is not None

    async def test_deleted_app_excluded_from_list(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        await db_session.commit()

        await int_client.delete(f"/api/apps/{app.id}", cookies=make_auth_cookie(user.id))

        resp = await int_client.get("/api/apps", cookies=make_auth_cookie(user.id))
        assert resp.json() == []

    async def test_double_delete_returns_404(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        await db_session.commit()

        await int_client.delete(f"/api/apps/{app.id}", cookies=make_auth_cookie(user.id))
        resp = await int_client.delete(f"/api/apps/{app.id}", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 404


class TestReorderApps:
    async def test_reorders_apps(self, int_client, db_session):
        user = await seed_user(db_session)
        app1 = await seed_app(db_session, user.id, slug="app1", display_order=0)
        app2 = await seed_app(db_session, user.id, slug="app2", display_order=1)
        await db_session.commit()

        resp = await int_client.post("/api/apps/reorder", json=[
            {"id": str(app1.id), "order": 1},
            {"id": str(app2.id), "order": 0},
        ], cookies=make_auth_cookie(user.id))
        assert resp.status_code == 204

        await db_session.refresh(app1)
        await db_session.refresh(app2)
        assert app1.display_order == 1
        assert app2.display_order == 0

    async def test_empty_reorder_is_noop(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post("/api/apps/reorder", json=[], cookies=make_auth_cookie(user.id))
        assert resp.status_code == 204

    async def test_duplicate_ids_rejected(self, int_client, db_session):
        import uuid
        user = await seed_user(db_session)
        await db_session.commit()

        dup = str(uuid.uuid4())
        resp = await int_client.post("/api/apps/reorder", json=[
            {"id": dup, "order": 0},
            {"id": dup, "order": 1},
        ], cookies=make_auth_cookie(user.id))
        assert resp.status_code == 400


class TestLaunchApp:
    async def test_launch_records_event(self, int_client, db_session):
        from models import LaunchEvent
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        await db_session.commit()

        resp = await int_client.post(
            f"/api/apps/{app.id}/launch",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 200

        events = (await db_session.execute(
            select(LaunchEvent).where(LaunchEvent.app_id == app.id)
        )).scalars().all()
        assert len(events) == 1

    async def test_launch_updates_last_opened_at(self, int_client, db_session):
        user = await seed_user(db_session)
        app = await seed_app(db_session, user.id)
        assert app.last_opened_at is None
        await db_session.commit()

        await int_client.post(
            f"/api/apps/{app.id}/launch",
            cookies=make_auth_cookie(user.id),
        )

        await db_session.refresh(app)
        assert app.last_opened_at is not None

    async def test_launch_nonexistent_returns_404(self, int_client, db_session):
        import uuid
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post(
            f"/api/apps/{uuid.uuid4()}/launch",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 404
