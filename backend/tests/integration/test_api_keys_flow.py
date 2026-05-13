"""
Integration tests for the /api/api-keys router.

Covers: create key, list keys, secret only on creation, revoke key,
and using API keys to authenticate requests.
"""
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from models import ApiKey
from auth.api_key_auth import resolve_api_key
from auth.password import hash_password
from tests.integration.conftest import seed_user, seed_app, seed_api_key, make_auth_cookie, int_client_apikey


class TestListKeys:
    async def test_empty_when_no_keys(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.get("/api/api-keys", cookies=make_auth_cookie(user.id))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_own_keys_only(self, int_client, db_session):
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        await seed_api_key(db_session, user1.id, "Key1")
        await seed_api_key(db_session, user2.id, "Key2")
        await db_session.commit()

        resp = await int_client.get("/api/api-keys", cookies=make_auth_cookie(user1.id))
        assert len(resp.json()) == 1

    async def test_does_not_return_secret_hash(self, int_client, db_session):
        user = await seed_user(db_session)
        await seed_api_key(db_session, user.id)
        await db_session.commit()

        resp = await int_client.get("/api/api-keys", cookies=make_auth_cookie(user.id))
        data = resp.json()[0]
        assert "secret" not in data
        assert "secret_hash" not in data

    async def test_unauthorized_returns_401(self, int_client, db_session):
        resp = await int_client.get("/api/api-keys")
        assert resp.status_code == 401


class TestCreateKey:
    async def test_creates_key_returns_201(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post(
            "/api/api-keys",
            json={"name": "My CI Key"},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 201

    async def test_secret_returned_only_on_creation(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post(
            "/api/api-keys",
            json={"name": "Secret Key"},
            cookies=make_auth_cookie(user.id),
        )
        data = resp.json()
        assert "secret" in data
        assert len(data["secret"]) > 10

    async def test_secret_not_returned_in_list(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        await int_client.post(
            "/api/api-keys",
            json={"name": "Key"},
            cookies=make_auth_cookie(user.id),
        )
        list_resp = await int_client.get("/api/api-keys", cookies=make_auth_cookie(user.id))
        assert "secret" not in list_resp.json()[0]

    async def test_prefix_stored(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post(
            "/api/api-keys",
            json={"name": "Key"},
            cookies=make_auth_cookie(user.id),
        )
        assert "prefix" in resp.json()
        assert len(resp.json()["prefix"]) == 8

    async def test_key_persisted_in_db(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        await int_client.post(
            "/api/api-keys",
            json={"name": "Persisted"},
            cookies=make_auth_cookie(user.id),
        )
        keys = (await db_session.execute(
            select(ApiKey).where(ApiKey.user_id == user.id)
        )).scalars().all()
        assert len(keys) == 1
        assert keys[0].name == "Persisted"

    @pytest.mark.parametrize("name,expected", [
        ("", 422),
        ("A" * 101, 422),
    ])
    async def test_invalid_name(self, int_client, db_session, name, expected):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post(
            "/api/api-keys",
            json={"name": name},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == expected


class TestRevokeKey:
    async def test_revoke_returns_204(self, int_client, db_session):
        user = await seed_user(db_session)
        key, _ = await seed_api_key(db_session, user.id)
        await db_session.commit()

        resp = await int_client.delete(
            f"/api/api-keys/{key.id}",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 204

    async def test_revoked_key_removed_from_db(self, int_client, db_session):
        user = await seed_user(db_session)
        key, _ = await seed_api_key(db_session, user.id)
        await db_session.commit()

        await int_client.delete(
            f"/api/api-keys/{key.id}",
            cookies=make_auth_cookie(user.id),
        )
        row = (await db_session.execute(
            select(ApiKey).where(ApiKey.id == key.id)
        )).scalar_one_or_none()
        assert row is None

    async def test_revoke_nonexistent_returns_404(self, int_client, db_session):
        import uuid
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.delete(
            f"/api/api-keys/{uuid.uuid4()}",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 404

    async def test_cannot_revoke_other_users_key(self, int_client, db_session):
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        key, _ = await seed_api_key(db_session, user1.id)
        await db_session.commit()

        resp = await int_client.delete(
            f"/api/api-keys/{key.id}",
            cookies=make_auth_cookie(user2.id),
        )
        assert resp.status_code == 404


class TestResolveApiKey:
    """Unit-level tests for the resolve_api_key function using the test DB."""

    async def test_valid_key_returns_user_id(self, engine, db_session):
        user = await seed_user(db_session)
        key, raw = await seed_api_key(db_session, user.id)
        await db_session.commit()

        factory = async_sessionmaker(engine, expire_on_commit=False)
        result = await resolve_api_key(raw, session_factory=factory)
        assert str(result) == str(user.id)

    async def test_invalid_key_returns_none(self, engine, db_session):
        user = await seed_user(db_session)
        await seed_api_key(db_session, user.id)
        await db_session.commit()

        factory = async_sessionmaker(engine, expire_on_commit=False)
        result = await resolve_api_key("completely-wrong-key-that-is-long-enough", session_factory=factory)
        assert result is None

    async def test_short_key_returns_none(self, engine, db_session):
        factory = async_sessionmaker(engine, expire_on_commit=False)
        result = await resolve_api_key("short", session_factory=factory)
        assert result is None

    async def test_correct_prefix_wrong_secret_returns_none(self, engine, db_session):
        user = await seed_user(db_session)
        key, raw = await seed_api_key(db_session, user.id)
        await db_session.commit()

        wrong_key = raw[:8] + "Z" * (len(raw) - 8)
        factory = async_sessionmaker(engine, expire_on_commit=False)
        result = await resolve_api_key(wrong_key, session_factory=factory)
        assert result is None

    async def test_updates_last_used_at(self, engine, db_session):
        user = await seed_user(db_session)
        key, raw = await seed_api_key(db_session, user.id)
        await db_session.commit()
        assert key.last_used_at is None

        factory = async_sessionmaker(engine, expire_on_commit=False)
        await resolve_api_key(raw, session_factory=factory)

        await db_session.refresh(key)
        assert key.last_used_at is not None


class TestApiKeyAuth:
    """Test that API keys can authenticate regular endpoints."""

    async def test_list_apps_with_api_key(self, int_client_apikey, db_session):
        user = await seed_user(db_session)
        await seed_app(db_session, user.id, name="Claude", slug="claude")
        await db_session.commit()

        # Create a key via the API (using cookie auth)
        create_resp = await int_client_apikey.post(
            "/api/api-keys",
            json={"name": "Test Key"},
            cookies=make_auth_cookie(user.id),
        )
        secret = create_resp.json()["secret"]

        # Use the API key to list apps
        resp = await int_client_apikey.get(
            "/api/apps",
            headers={"Authorization": f"Bearer {secret}"},
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]["name"] == "Claude"

    async def test_revoked_key_returns_401(self, int_client_apikey, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        create_resp = await int_client_apikey.post(
            "/api/api-keys",
            json={"name": "Revokable"},
            cookies=make_auth_cookie(user.id),
        )
        data = create_resp.json()
        secret = data["secret"]

        # Revoke
        await int_client_apikey.delete(
            f"/api/api-keys/{data['id']}",
            cookies=make_auth_cookie(user.id),
        )

        # Try using revoked key
        resp = await int_client_apikey.get(
            "/api/apps",
            headers={"Authorization": f"Bearer {secret}"},
        )
        assert resp.status_code == 401

    async def test_add_app_with_api_key(self, int_client_apikey, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        # Create a key
        create_resp = await int_client_apikey.post(
            "/api/api-keys",
            json={"name": "Automation Key"},
            cookies=make_auth_cookie(user.id),
        )
        secret = create_resp.json()["secret"]

        # Add an app using the API key
        resp = await int_client_apikey.post(
            "/api/apps",
            json={
                "name": "Claude",
                "slug": "claude",
                "color": "FF5733",
                "url": "https://claude.ai",
                "category": "ai",
                "plan": "paid",
            },
            headers={"Authorization": f"Bearer {secret}"},
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "Claude"
