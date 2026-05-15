"""Desktop OAuth state and exchange-code helpers."""
import time
from jose import jwt

from auth.jwt import SECRET, ALGORITHM
from routers.auth import (
    _create_desktop_exchange_code,
    _consume_desktop_exchange_code,
    _create_oauth_state,
    _verify_oauth_state,
)


def test_oauth_state_web_roundtrip():
    state = _create_oauth_state(desktop=False)
    valid, is_desktop = _verify_oauth_state(state)
    assert valid is True
    assert is_desktop is False


def test_oauth_state_desktop_roundtrip():
    state = _create_oauth_state(desktop=True)
    valid, is_desktop = _verify_oauth_state(state)
    assert valid is True
    assert is_desktop is True


def test_desktop_exchange_code_roundtrip():
    code = _create_desktop_exchange_code("00000000-0000-4000-8000-000000000001")
    user_id = _consume_desktop_exchange_code(code)
    assert user_id == "00000000-0000-4000-8000-000000000001"


def test_desktop_exchange_code_rejects_wrong_purpose():
    token = jwt.encode(
        {"sub": "u1", "purpose": "other", "exp": int(time.time()) + 60},
        SECRET,
        algorithm=ALGORITHM,
    )
    import pytest
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        _consume_desktop_exchange_code(token)
    assert exc.value.status_code == 400
