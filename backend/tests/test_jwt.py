import pytest
import os
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

# Set required env var before importing jwt module
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-unit-tests")

from auth.jwt import create_access_token, decode_token, get_current_user_id, COOKIE_NAME
from fastapi import HTTPException


class TestCreateAccessToken:
    def test_returns_string_token(self):
        token = create_access_token("user-123")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_includes_user_id_in_payload(self):
        token = create_access_token("user-456")
        claims = decode_token(token)
        assert claims["user_id"] == "user-456"

    def test_includes_token_version(self):
        token = create_access_token("user-123", token_version=5)
        claims = decode_token(token)
        assert claims["token_version"] == 5

    def test_default_token_version_is_zero(self):
        token = create_access_token("user-123")
        claims = decode_token(token)
        assert claims["token_version"] == 0

    def test_custom_expiry(self):
        token = create_access_token("user-123", expire_minutes=1)
        claims = decode_token(token)
        assert claims["user_id"] == "user-123"


class TestDecodeToken:
    def test_valid_token(self):
        token = create_access_token("user-789", token_version=3)
        claims = decode_token(token)
        assert claims["user_id"] == "user-789"
        assert claims["token_version"] == 3

    def test_invalid_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid.token.here")
        assert exc_info.value.status_code == 401

    def test_empty_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            decode_token("")
        assert exc_info.value.status_code == 401

    def test_expired_token_raises_401(self):
        token = create_access_token("user-123", expire_minutes=-1)
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        assert exc_info.value.status_code == 401


class TestGetCurrentUserId:
    def test_extracts_from_cookie(self):
        token = create_access_token("user-from-cookie")
        request = MagicMock()
        request.cookies = {COOKIE_NAME: token}
        request.state = MagicMock()

        result = get_current_user_id(request, bearer=None)
        assert result == "user-from-cookie"

    def test_extracts_from_bearer(self):
        token = create_access_token("user-from-bearer")
        request = MagicMock()
        request.cookies = {}
        request.state = MagicMock()
        bearer = MagicMock()
        bearer.credentials = token

        result = get_current_user_id(request, bearer=bearer)
        assert result == "user-from-bearer"

    def test_cookie_takes_precedence_over_bearer(self):
        cookie_token = create_access_token("cookie-user")
        bearer_token = create_access_token("bearer-user")
        request = MagicMock()
        request.cookies = {COOKIE_NAME: cookie_token}
        request.state = MagicMock()
        bearer = MagicMock()
        bearer.credentials = bearer_token

        result = get_current_user_id(request, bearer=bearer)
        assert result == "cookie-user"

    def test_no_token_raises_401(self):
        request = MagicMock()
        request.cookies = {}
        request.state = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(request, bearer=None)
        assert exc_info.value.status_code == 401

    def test_sets_request_state(self):
        token = create_access_token("user-state", token_version=2)
        request = MagicMock()
        request.cookies = {COOKIE_NAME: token}
        request.state = MagicMock()

        get_current_user_id(request, bearer=None)
        assert request.state.user_id == "user-state"
        assert request.state.token_version == 2
