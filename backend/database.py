from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import event, text
from dotenv import load_dotenv
import logging
import os
import time

load_dotenv()

logger = logging.getLogger("orbit.db")

_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://orbit:orbit@localhost:5432/orbitdb")
SLOW_QUERY_MS = int(os.getenv("SLOW_QUERY_MS", "200"))

# Convert postgres:// / postgresql:// → postgresql+asyncpg://
_ASYNC_URL = _DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1).replace("postgres://", "postgresql+asyncpg://", 1)

_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
_POOL_OVERFLOW = int(os.getenv("DB_POOL_OVERFLOW", "20"))

engine = create_async_engine(
    _ASYNC_URL,
    pool_size=_POOL_SIZE,
    max_overflow=_POOL_OVERFLOW,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    echo=False,
    connect_args={"server_settings": {"statement_timeout": "30000"}},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def pool_status() -> dict:
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "checked_in": pool.checkedin(),
    }
