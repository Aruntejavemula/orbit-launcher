"""Legacy and edge cases for OAuth state parsing."""
import time
import hmac
import hashlib

from auth.jwt import SECRET
from routers.auth import _parse_oauth_state


def test_legacy_two_part_state_valid():
    ts = str(int(time.time()))
    sig = hmac.new(SECRET.encode(), ts.encode(), hashlib.sha256).hexdigest()[:16]
    state = f"{ts}.{sig}"
    valid, desktop, remio, remember = _parse_oauth_state(state)
    assert valid is True
    assert desktop is False
    assert remio is False
    assert remember is False


def test_three_part_desktop_mode():
    ts = str(int(time.time()))
    mode = "d"
    sig = hmac.new(SECRET.encode(), f"{ts}:{mode}".encode(), hashlib.sha256).hexdigest()[:16]
    state = f"{ts}.{sig}.{mode}"
    valid, desktop, remio, remember = _parse_oauth_state(state)
    assert valid is True
    assert desktop is True
    assert remio is False
    assert remember is False


def test_invalid_state_rejected():
    valid, desktop, remio, remember = _parse_oauth_state("not-a-state")
    assert valid is False
    assert desktop is False
    assert remio is False
    assert remember is False


def test_expired_state_rejected():
    ts = str(int(time.time()) - 600)
    sig = hmac.new(SECRET.encode(), f"{ts}:w:0".encode(), hashlib.sha256).hexdigest()[:16]
    state = f"{ts}.{sig}.w.0"
    valid, *_ = _parse_oauth_state(state, max_age=300)
    assert valid is False
