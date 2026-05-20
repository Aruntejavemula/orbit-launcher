import pytest

from auth.google import get_google_oauth_config, google_oauth_configured, get_google_auth_url
from routers.auth import _create_oauth_state, _oauth_state_valid, _parse_oauth_state


def test_oauth_state_valid_signed_with_cookie(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-min-32-chars-long!!")
    from importlib import reload
    import routers.auth as auth_mod

    reload(auth_mod)
    state = auth_mod._create_oauth_state(desktop=True)

    class FakeRequest:
        cookies = {auth_mod._GOOGLE_STATE_COOKIE: state}

    valid, platform, remio, remember = auth_mod._oauth_state_valid(FakeRequest(), state)
    assert valid is True
    assert platform == "desktop"
    assert remio is False
    assert remember is False


def test_oauth_state_remember_roundtrip():
    state = _create_oauth_state(desktop=False, remember=True)
    valid, desktop_creds, remio, remember = _parse_oauth_state(state)
    assert valid is True
    assert desktop_creds is False
    assert remio is False
    assert remember is True


def test_web_and_desktop_configs(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "web-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "web-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/api/auth/google/callback")
    monkeypatch.setenv("GOOGLE_CLIENT_ID_DESKTOP", "desktop-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET_DESKTOP", "desktop-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI_DESKTOP", "http://localhost:5173/api/auth/google/callback")

    from importlib import reload
    import auth.google as google_mod

    reload(google_mod)

    web = google_mod.get_google_oauth_config("web")
    desktop = google_mod.get_google_oauth_config("desktop")
    assert web.client_id == "web-id"
    assert desktop.client_id == "desktop-id"
    assert google_mod.google_oauth_configured("web")
    assert google_mod.google_oauth_configured("desktop")
    web_url = google_mod.get_google_auth_url("state123", platform="web")
    desktop_url = google_mod.get_google_auth_url("state123", platform="desktop")
    assert "client_id=web-id" in web_url
    assert "prompt=select_account" not in web_url
    assert "client_id=desktop-id" in desktop_url
    assert "prompt=select_account" in desktop_url
