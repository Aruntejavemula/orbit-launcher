"""
Shared test fixtures for Orbit Launcher backend integration tests.

Provides a test FastAPI app with rate limiting disabled, mock DB session,
auth overrides, and data factories.
"""
import os
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Set required env vars before any app imports
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-unit-tests")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
os.environ.setdefault("RESEND_API_KEY", "re_test_fake_key")

from database import get_db
from auth.jwt import get_current_user_id, create_access_token, COOKIE_NAME

TEST_USER_ID = "test-user-id-00000000"


# ---------------------------------------------------------------------------
# Mock DB session
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db():
    """AsyncMock session that simulates SQLAlchemy AsyncSession."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    session.add = MagicMock()
    session.execute = AsyncMock()
    return session


# ---------------------------------------------------------------------------
# Test app with dependencies overridden
# ---------------------------------------------------------------------------

@pytest.fixture
def test_app(mock_db):
    """
    FastAPI app with rate limiting disabled and dependencies overridden.
    Re-imports main each time to avoid cross-test state leakage.
    """
    from main import app

    # Disable rate limiters by making them no-ops
    app.state.limiter.enabled = False
    app.state.user_limiter.enabled = False

    # Override DB dependency
    async def override_get_db():
        yield mock_db

    # Override auth dependency
    def override_get_current_user_id():
        return TEST_USER_ID

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    yield app

    # Cleanup
    app.dependency_overrides.clear()
    app.state.limiter.enabled = True
    app.state.user_limiter.enabled = True


# ---------------------------------------------------------------------------
# Async HTTP client
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client(test_app) -> AsyncGenerator[AsyncClient, None]:
    """httpx.AsyncClient configured to talk to the test app."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

@pytest.fixture
def auth_headers():
    """Returns a dict with a valid Bearer Authorization header for the test user."""
    token = create_access_token(TEST_USER_ID, token_version=0)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_cookies():
    """Returns a cookie dict with valid orbit_session cookie."""
    token = create_access_token(TEST_USER_ID, token_version=0)
    return {COOKIE_NAME: token}


# ---------------------------------------------------------------------------
# Data factories
# ---------------------------------------------------------------------------

def make_user(
    user_id: str | None = None,
    email: str = "test@example.com",
    name: str = "Test User",
):
    """Create a mock User-like object."""
    user = MagicMock()
    user.id = user_id or str(uuid.uuid4())
    user.email = email
    user.name = name
    user.created_at = datetime.now(timezone.utc)
    user.token_version = 0
    return user


def make_app(
    app_id: uuid.UUID | None = None,
    user_id: str = TEST_USER_ID,
    name: str = "Test App",
    slug: str = "test-app",
    color: str = "FF5733",
    url: str = "https://example.com",
    category: str = "productivity",
    plan: str = "free",
    display_order: int = 0,
    is_deleted: bool = False,
    deleted_at: datetime | None = None,
    last_opened_at: datetime | None = None,
    created_at: datetime | None = None,
    monthly_cost: float | None = None,
    expires_at: datetime | None = None,
    manage_url: str | None = None,
    icon_key: str | None = None,
    frequency: str | None = None,
    pending_unsubscribe_at: datetime | None = None,
):
    """Create a mock AppItem-like object."""
    app = MagicMock()
    app.id = app_id or uuid.uuid4()
    app.user_id = user_id
    app.name = name
    app.slug = slug
    app.color = color
    app.url = url
    app.category = category
    app.plan = plan
    app.display_order = display_order
    app.is_deleted = is_deleted
    app.deleted_at = deleted_at
    app.last_opened_at = last_opened_at
    app.created_at = created_at or datetime.now(timezone.utc)
    app.monthly_cost = monthly_cost
    app.expires_at = expires_at
    app.manage_url = manage_url
    app.icon_key = icon_key
    app.frequency = frequency
    app.pending_unsubscribe_at = pending_unsubscribe_at
    return app


def make_launch(
    app_id: uuid.UUID | None = None,
    user_id: str = TEST_USER_ID,
    launched_at: datetime | None = None,
):
    """Create a mock LaunchEvent-like object."""
    event = MagicMock()
    event.id = uuid.uuid4()
    event.user_id = user_id
    event.app_id = app_id or uuid.uuid4()
    event.launched_at = launched_at or datetime.now(timezone.utc)
    return event


def make_preferences(
    user_id: str = TEST_USER_ID,
    theme: str = "light",
    reminder_days: int = 7,
    onboarding_completed: bool = False,
):
    """Create a mock Preferences-like object."""
    prefs = MagicMock()
    prefs.id = uuid.uuid4()
    prefs.user_id = user_id
    prefs.theme = theme
    prefs.start_week_on_monday = False
    prefs.compact_cards = False
    prefs.show_last_opened = True
    prefs.notify_expirations = True
    prefs.reminder_days = reminder_days
    prefs.reminder_email = True
    prefs.reminder_push = False
    prefs.onboarding_completed = onboarding_completed
    prefs.country = ""
    prefs.created_at = datetime.now(timezone.utc)
    prefs.updated_at = datetime.now(timezone.utc)
    return prefs
