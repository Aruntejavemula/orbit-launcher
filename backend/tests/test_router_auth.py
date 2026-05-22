"""Unit tests for /api/auth router (non-OAuth flows)."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from auth.password import hash_password
from tests.conftest import TEST_USER_ID, make_user


def _empty_user_lookup(mock_db):
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=result_mock)


@pytest.mark.asyncio
async def test_register_success(client, mock_db):
    _empty_user_lookup(mock_db)

    async def refresh_user(user):
        user.id = TEST_USER_ID
        user.token_version = 0

    mock_db.refresh = AsyncMock(side_effect=refresh_user)

    with patch("routers.auth._create_default_prefs", new_callable=AsyncMock):
        resp = await client.post(
            "/api/auth/register",
            json={"name": "New User", "email": "new@example.com", "password": "SecurePass1!"},
        )
    assert resp.status_code in (200, 201)
    body = resp.json()
    assert body["ok"] is True
    assert body.get("access_token")
    assert "orbit_session" in resp.cookies


@pytest.mark.asyncio
async def test_register_duplicate_email(client, mock_db):
    existing = make_user()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = existing
    mock_db.execute = AsyncMock(return_value=result_mock)

    resp = await client.post(
        "/api/auth/register",
        json={"name": "Dup", "email": "dup@example.com", "password": "SecurePass1!"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client, mock_db):
    user = make_user(user_id=TEST_USER_ID, email="login@example.com")
    user.password_hash = hash_password("SecurePass1!")
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = user
    mock_db.execute = AsyncMock(return_value=result_mock)

    resp = await client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "SecurePass1!", "remember_me": False},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
    assert body.get("access_token")
    assert "orbit_session" in resp.cookies


@pytest.mark.asyncio
async def test_login_invalid_password(client, mock_db):
    user = make_user(email="login@example.com")
    user.password_hash = hash_password("SecurePass1!")
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = user
    mock_db.execute = AsyncMock(return_value=result_mock)

    resp = await client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "WrongPass1!", "remember_me": False},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_remember_device(client, mock_db):
    user = make_user(user_id=TEST_USER_ID)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = user
    mock_db.execute = AsyncMock(return_value=result_mock)

    resp = await client.post(
        "/api/auth/remember-device",
        json={"remember_device": True},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["remember_device"] is True
    assert body.get("access_token")
    assert "orbit_session" in resp.cookies
