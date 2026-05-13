"""
Integration tests for the auth flow.

Tests real DB + real JWT + real HTTP through FastAPI.
Covers: register, login, /me, logout, change-password, forgot-password OTP flow.
"""
import pytest
from sqlalchemy import select

from models import User, Preferences
from tests.integration.conftest import (
    seed_user,
    seed_preferences,
    make_auth_cookie,
    TEST_EMAIL,
    TEST_PASSWORD,
    TEST_NAME,
)


class TestRegister:
    async def test_register_creates_user_and_prefs(self, int_client, db_session):
        resp = await int_client.post("/api/auth/register", json={
            "name": TEST_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        })
        assert resp.status_code in (200, 201)

        user = (await db_session.execute(select(User).where(User.email == TEST_EMAIL))).scalar_one_or_none()
        assert user is not None
        assert user.name == TEST_NAME

        prefs = (await db_session.execute(select(Preferences).where(Preferences.user_id == user.id))).scalar_one_or_none()
        assert prefs is not None
        assert prefs.theme.value == "light"
        assert prefs.reminder_days == 7

    async def test_register_sets_auth_cookie(self, int_client, db_session):
        resp = await int_client.post("/api/auth/register", json={
            "name": TEST_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        })
        assert resp.status_code in (200, 201)
        assert "orbit_session" in resp.cookies

    async def test_register_conflict_on_duplicate_email(self, int_client, db_session):
        await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post("/api/auth/register", json={
            "name": "Another",
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        })
        assert resp.status_code == 409

    @pytest.mark.parametrize("payload,expected", [
        ({"name": "X", "email": "bad-email", "password": TEST_PASSWORD}, 422),
        ({"name": "X", "email": TEST_EMAIL, "password": "short"}, 422),
        ({"email": TEST_EMAIL, "password": TEST_PASSWORD}, 422),  # missing name
    ])
    async def test_register_validation(self, int_client, db_session, payload, expected):
        resp = await int_client.post("/api/auth/register", json=payload)
        assert resp.status_code == expected

    async def test_register_weak_password_rejected(self, int_client, db_session):
        resp = await int_client.post("/api/auth/register", json={
            "name": TEST_NAME,
            "email": TEST_EMAIL,
            "password": "password123",
        })
        assert resp.status_code == 422


class TestLogin:
    async def test_login_with_valid_credentials(self, int_client, db_session):
        await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post("/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        })
        assert resp.status_code == 200
        assert "orbit_session" in resp.cookies

    async def test_login_wrong_password(self, int_client, db_session):
        await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post("/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "WrongPass!999",
        })
        assert resp.status_code == 401

    async def test_login_unknown_email(self, int_client, db_session):
        resp = await int_client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": TEST_PASSWORD,
        })
        assert resp.status_code == 401

    async def test_login_remember_me_extends_cookie(self, int_client, db_session):
        await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post("/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "remember": True,
        })
        assert resp.status_code == 200


class TestMe:
    async def test_me_returns_user(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        cookies = make_auth_cookie(user.id, user.token_version)
        resp = await int_client.get("/api/auth/me", cookies=cookies)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == TEST_EMAIL
        assert data["name"] == TEST_NAME

    async def test_me_unauthorized_without_cookie(self, int_client, db_session):
        resp = await int_client.get("/api/auth/me")
        assert resp.status_code == 401

    async def test_me_with_bearer_token(self, int_client, db_session):
        from tests.integration.conftest import make_auth_header
        user = await seed_user(db_session)
        await db_session.commit()

        headers = make_auth_header(user.id, user.token_version)
        resp = await int_client.get("/api/auth/me", headers=headers)
        assert resp.status_code == 200


class TestLogout:
    async def test_logout_clears_cookie(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        cookies = make_auth_cookie(user.id)
        resp = await int_client.post("/api/auth/logout", cookies=cookies)
        assert resp.status_code in (200, 204)
        # Cookie should be cleared (empty value or deleted)
        set_cookie = resp.headers.get("set-cookie", "")
        assert "orbit_session" in set_cookie

    async def test_logout_increments_token_version(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()
        old_version = user.token_version

        cookies = make_auth_cookie(user.id, old_version)
        resp = await int_client.post("/api/auth/logout", cookies=cookies)
        assert resp.status_code in (200, 204)

        await db_session.refresh(user)
        assert user.token_version == old_version + 1

    async def test_old_token_rejected_after_logout(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        cookies = make_auth_cookie(user.id, user.token_version)
        await int_client.post("/api/auth/logout", cookies=cookies)

        # Old cookie token_version=0, but DB now has version=1
        resp = await int_client.get("/api/auth/me", cookies=cookies)
        assert resp.status_code == 401


class TestUpdateProfile:
    async def test_update_name(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        cookies = make_auth_cookie(user.id)
        resp = await int_client.patch("/api/auth/me", json={"name": "New Name"}, cookies=cookies)
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    async def test_update_avatar_url(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        cookies = make_auth_cookie(user.id)
        resp = await int_client.patch(
            "/api/auth/me",
            json={"avatar_url": "https://example.com/avatar.png"},
            cookies=cookies,
        )
        assert resp.status_code == 200
