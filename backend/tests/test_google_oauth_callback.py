"""Google OAuth callback and login routes (incl. Capacitor remio handoff)."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from routers.auth import _GOOGLE_STATE_COOKIE, _create_oauth_state
from tests.conftest import TEST_USER_ID, make_user


def _google_env(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "web-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "web-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost/api/auth/google/callback")
    monkeypatch.setenv("GOOGLE_CLIENT_ID_DESKTOP", "desktop-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET_DESKTOP", "desktop-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI_DESKTOP", "http://localhost/api/auth/google/callback")


@pytest.mark.asyncio
async def test_google_login_desktop_redirect(client, monkeypatch):
    _google_env(monkeypatch)
    with patch("routers.auth.google_oauth_configured", return_value=True):
        with patch("routers.auth.get_google_auth_url", return_value="https://accounts.google.com/o/oauth"):
            resp = await client.get("/api/auth/google?platform=desktop&desktop=1")
    assert resp.status_code in (302, 307)
    assert resp.headers["location"].startswith("https://accounts.google.com")
    assert _GOOGLE_STATE_COOKIE in resp.cookies


@pytest.mark.asyncio
async def test_google_login_web_not_configured(client, monkeypatch):
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)
    with patch("routers.auth.google_oauth_configured", return_value=False):
        resp = await client.get("/api/auth/google")
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_google_login_desktop_not_configured(client, monkeypatch):
    _google_env(monkeypatch)
    with patch("routers.auth.google_oauth_configured", side_effect=lambda p: p == "web"):
        resp = await client.get("/api/auth/google?desktop=1")
    assert resp.status_code == 503
    assert "Desktop Google" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_google_callback_invalid_state(client):
    resp = await client.get("/api/auth/google/callback?code=x&state=bad.state.here")
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_google_callback_remio_handoff_existing_user(client, mock_db, monkeypatch):
    _google_env(monkeypatch)
    user = make_user(user_id=TEST_USER_ID, email="oauth@example.com")
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = user
    mock_db.execute = AsyncMock(return_value=result_mock)

    state = _create_oauth_state(desktop=True, remio=True)
    guser = {"sub": "google-sub-1", "email": "oauth@example.com", "name": "OAuth User", "picture": None}

    with patch("routers.auth.exchange_code_for_user", new_callable=AsyncMock, return_value=guser):
        resp = await client.get(
            f"/api/auth/google/callback?code=auth-code&state={state}",
            cookies={_GOOGLE_STATE_COOKIE: state},
        )

    assert resp.status_code == 302
    location = resp.headers["location"]
    assert location.startswith("remio://auth/callback?code=")
    assert "error" not in location


@pytest.mark.asyncio
async def test_google_callback_remio_handoff_new_user(client, mock_db, monkeypatch):
    _google_env(monkeypatch)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=result_mock)

    async def refresh_user(user):
        user.id = TEST_USER_ID
        user.token_version = 0

    mock_db.refresh = AsyncMock(side_effect=refresh_user)

    state = _create_oauth_state(desktop=True, remio=True)
    guser = {"sub": "new-google", "email": "new@example.com", "name": "New", "picture": None}

    with patch("routers.auth.exchange_code_for_user", new_callable=AsyncMock, return_value=guser):
        with patch("routers.auth._create_default_prefs", new_callable=AsyncMock):
            resp = await client.get(
                f"/api/auth/google/callback?code=auth-code&state={state}",
                cookies={_GOOGLE_STATE_COOKIE: state},
            )

    assert resp.status_code == 302
    assert resp.headers["location"].startswith("remio://auth/callback?code=")


@pytest.mark.asyncio
async def test_google_callback_remio_exchange_error_redirect(client, mock_db, monkeypatch):
    _google_env(monkeypatch)
    state = _create_oauth_state(desktop=True, remio=True)

    with patch(
        "routers.auth.exchange_code_for_user",
        new_callable=AsyncMock,
        side_effect=RuntimeError("token exchange failed"),
    ):
        resp = await client.get(
            f"/api/auth/google/callback?code=bad&state={state}",
            cookies={_GOOGLE_STATE_COOKIE: state},
        )

    assert resp.status_code == 302
    assert resp.headers["location"] == "remio://auth/callback?error=1"


@pytest.mark.asyncio
async def test_google_callback_links_existing_email_user(client, mock_db, monkeypatch):
    _google_env(monkeypatch)
    user = make_user(email="link@example.com")
    results = [MagicMock(), MagicMock()]
    results[0].scalar_one_or_none.return_value = None
    results[1].scalar_one_or_none.return_value = user
    mock_db.execute = AsyncMock(side_effect=results)

    state = _create_oauth_state(desktop=False, remio=False)
    guser = {"sub": "gid-link", "email": "link@example.com", "name": "Link", "picture": "http://pic"}

    with patch("routers.auth.exchange_code_for_user", new_callable=AsyncMock, return_value=guser):
        resp = await client.get(
            f"/api/auth/google/callback?code=auth-code&state={state}",
            cookies={_GOOGLE_STATE_COOKIE: state},
        )

    assert resp.status_code == 302
    assert "/auth/callback" in resp.headers["location"]
    mock_db.commit.assert_awaited()


@pytest.mark.asyncio
async def test_google_callback_web_redirect_sets_cookie(client, mock_db, monkeypatch):
    _google_env(monkeypatch)
    user = make_user(user_id=TEST_USER_ID)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = user
    mock_db.execute = AsyncMock(return_value=result_mock)

    state = _create_oauth_state(desktop=False, remio=False)
    guser = {"sub": "gid", "email": user.email, "name": user.name, "picture": None}

    with patch("routers.auth.exchange_code_for_user", new_callable=AsyncMock, return_value=guser):
        with patch("routers.auth.FRONTEND_URL", "http://localhost:5173"):
            resp = await client.get(
                f"/api/auth/google/callback?code=auth-code&state={state}",
                cookies={_GOOGLE_STATE_COOKIE: state},
            )

    assert resp.status_code == 302
    assert resp.headers["location"].endswith("/auth/callback")
    assert "orbit_session" in resp.cookies


@pytest.mark.asyncio
async def test_oauth_state_valid_cookie_only_fallback(client, mock_db, monkeypatch):
    _google_env(monkeypatch)
    user = make_user(user_id=TEST_USER_ID)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = user
    mock_db.execute = AsyncMock(return_value=result_mock)

    state = _create_oauth_state(desktop=False, remio=False)
    guser = {"sub": "gid2", "email": user.email, "name": user.name, "picture": None}

    with patch("routers.auth.exchange_code_for_user", new_callable=AsyncMock, return_value=guser):
        with patch("routers.auth.FRONTEND_URL", "http://localhost:5173"):
            resp = await client.get(
                f"/api/auth/google/callback?code=auth-code&state={state}",
                cookies={_GOOGLE_STATE_COOKIE: state},
            )

    assert resp.status_code == 302
