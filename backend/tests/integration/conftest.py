"""
Integration test fixtures.

Uses an in-memory SQLite database (via aiosqlite) instead of PostgreSQL.
Every test gets a fresh database with all tables created and torn down after.

Key decisions:
- SQLite in-memory: fast, no external service needed in CI
- UUID columns: SQLite stores them as strings; mapped with native_enum=False
- Rate limiting: disabled on the app instance for integration tests
- Auth: real JWT tokens created with create_access_token
"""
import os
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Set required env vars before any app imports
os.environ.setdefault("JWT_SECRET", "integration-test-secret-do-not-use-in-prod")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
os.environ.setdefault("RESEND_API_KEY", "re_test_fake_key")
os.environ.setdefault("VAPID_PUBLIC_KEY", "test-vapid-key")

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, Request as _Request
from auth.jwt import COOKIE_NAME, create_access_token, get_current_user_id as _real_get_current_user_id
from database import Base, get_db
from auth.jwt import get_current_user_id
from auth.password import hash_password
from models import User, AppItem, LaunchEvent, Reminder, Preferences, ApiKey
from models.push_subscription import PushSubscription

_bearer_scheme = HTTPBearer(auto_error=False)


def _get_current_user_id_as_uuid(
    request: _Request,
    bearer: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
):
    """
    Wrapper around real get_current_user_id that converts the string user_id
    to a uuid.UUID object. Required for SQLite integration tests:
    SQLAlchemy's UUID(as_uuid=True) bind processor calls .hex on the value,
    which fails for plain strings. uuid.UUID objects have .hex.
    Real JWT validation still happens inside _real_get_current_user_id.
    """
    # Middleware may have already resolved the user via API key
    if getattr(request.state, "via_api_key", False) and getattr(request.state, "user_id", None):
        uid = request.state.user_id
        try:
            return uuid.UUID(uid) if not isinstance(uid, uuid.UUID) else uid
        except (ValueError, AttributeError):
            return uid

    str_id = _real_get_current_user_id(request, bearer)
    try:
        return uuid.UUID(str_id)
    except (ValueError, AttributeError):
        return str_id


def _make_api_key_int_client_fixture():
    """
    Returns a fixture factory for an int_client that supports API key auth.
    The middleware's _try_api_key is patched to use the test DB session factory.
    """
    @pytest_asyncio.fixture(scope="function")
    async def int_client_apikey(engine, db_session: AsyncSession):
        from unittest.mock import patch, AsyncMock
        from main import app

        app.state.limiter.enabled = False
        app.state.user_limiter.enabled = False

        test_session_factory = async_sessionmaker(engine, expire_on_commit=False)

        async def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user_id] = _get_current_user_id_as_uuid

        transport = ASGITransport(app=app)

        with patch("auth.api_key_auth.AsyncSessionLocal", test_session_factory):
            async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
                yield ac

        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user_id, None)
        app.state.limiter.enabled = True
        app.state.user_limiter.enabled = True

    return int_client_apikey


int_client_apikey = _make_api_key_int_client_fixture()


def _create_tables_sqlite_safe(conn):
    """
    Create all tables, temporarily removing PostgreSQL-specific CheckConstraints
    that use INTERVAL syntax not supported by SQLite.

    Constraints are restored after creation so the model metadata isn't mutated
    permanently (which would break other tests in the same process).
    """
    from sqlalchemy import CheckConstraint
    stripped = {}
    for table in Base.metadata.tables.values():
        pg_checks = [c for c in list(table.constraints)
                     if isinstance(c, CheckConstraint) and "INTERVAL" in str(c.sqltext)]
        if pg_checks:
            for c in pg_checks:
                table.constraints.discard(c)
            stripped[table] = pg_checks

    Base.metadata.create_all(conn)

    # Restore so subsequent test sessions don't see mutated metadata
    for table, checks in stripped.items():
        for c in checks:
            table.constraints.add(c)


# ---------------------------------------------------------------------------
# SQLite engine — one per test session, isolated via tables recreated per test
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="function")
async def engine():
    """
    In-memory async SQLite engine.

    StaticPool ensures a single connection is reused throughout the test,
    which is required for in-memory SQLite (a new connection = empty DB).
    connect_args check_same_thread=False is needed for async SQLite.
    """
    _engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with _engine.begin() as conn:
        await conn.run_sync(_create_tables_sqlite_safe)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Real AsyncSession bound to in-memory SQLite."""
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


# ---------------------------------------------------------------------------
# Test app with real DB injected
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="function")
async def int_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    httpx.AsyncClient wired to the FastAPI app with:
    - DB dependency overridden to use the real SQLite session
    - Rate limiting disabled
    - Auth NOT overridden (tests send real JWT cookies/headers)
    """
    from main import app

    app.state.limiter.enabled = False
    app.state.user_limiter.enabled = False

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_id] = _get_current_user_id_as_uuid

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user_id, None)
    app.state.limiter.enabled = True
    app.state.user_limiter.enabled = True


# ---------------------------------------------------------------------------
# Seed helpers — insert real rows into the DB
# ---------------------------------------------------------------------------

TEST_EMAIL = "integration@example.com"
TEST_PASSWORD = "Str0ng!Pass#2024"
TEST_NAME = "Integration User"


async def seed_user(
    db: AsyncSession,
    email: str = TEST_EMAIL,
    name: str = TEST_NAME,
    password: str = TEST_PASSWORD,
) -> User:
    user = User(name=name, email=email, password_hash=hash_password(password))
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def seed_preferences(db: AsyncSession, user_id) -> Preferences:
    prefs = Preferences(user_id=user_id)
    db.add(prefs)
    await db.flush()
    await db.refresh(prefs)
    return prefs


async def seed_app(
    db: AsyncSession,
    user_id,
    name: str = "Test App",
    slug: str = "test-app",
    color: str = "FF5733",
    url: str = "https://example.com",
    category: str = "productivity",
    plan: str = "free",
    display_order: int = 0,
) -> AppItem:
    app = AppItem(
        user_id=user_id,
        name=name,
        slug=slug,
        color=color,
        url=url,
        category=category,
        plan=plan,
        display_order=display_order,
    )
    db.add(app)
    await db.flush()
    await db.refresh(app)
    return app


async def seed_reminder(
    db: AsyncSession,
    user_id,
    app_id,
    remind_days_before: int = 7,
    method: str = "email",
) -> Reminder:
    r = Reminder(
        user_id=user_id,
        app_id=app_id,
        remind_days_before=remind_days_before,
        method=method,
    )
    db.add(r)
    await db.flush()
    await db.refresh(r)
    return r


async def seed_api_key(db: AsyncSession, user_id, name: str = "My Key") -> tuple[ApiKey, str]:
    raw = "testrawsecret1234567890123456789012"
    prefix = raw[:8]
    key = ApiKey(user_id=user_id, name=name, prefix=prefix, secret_hash=hash_password(raw))
    db.add(key)
    await db.flush()
    await db.refresh(key)
    return key, raw


def make_auth_cookie(user_id, token_version: int = 0) -> dict:
    token = create_access_token(str(user_id), token_version=token_version)
    return {COOKIE_NAME: token}


def make_auth_header(user_id, token_version: int = 0) -> dict:
    token = create_access_token(str(user_id), token_version=token_version)
    return {"Authorization": f"Bearer {token}"}
