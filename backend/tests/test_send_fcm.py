"""Unit tests for FCM send helper."""
from unittest.mock import MagicMock, patch

import pytest

from tasks import send_fcm as fcm_mod


@pytest.fixture(autouse=True)
def reset_credentials():
    fcm_mod._credentials = None
    yield
    fcm_mod._credentials = None


def test_not_configured_returns_false():
    with patch.object(fcm_mod, "_FIREBASE_PROJECT_ID", ""):
        with patch.object(fcm_mod, "_FIREBASE_CREDENTIALS_JSON", ""):
            assert fcm_mod.send_fcm_notification("token", {"title": "T", "body": "B"}) is False


def test_send_success():
    with patch.object(fcm_mod, "_fcm_configured", return_value=True):
        with patch.object(fcm_mod, "_access_token", return_value="tok"):
            with patch("tasks.send_fcm.requests.post") as post:
                post.return_value = MagicMock(status_code=200)
                assert fcm_mod.send_fcm_notification("abc", {"title": "Hi", "body": "There"}) is True
