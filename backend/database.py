from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import logging
import os
import time

load_dotenv()

logger = logging.getLogger("orbit.db")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://orbit:orbit@localhost:5432/orbitdb")
SLOW_QUERY_MS = int(os.getenv("SLOW_QUERY_MS", "200"))

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# --- slow query logging ---

@event.listens_for(engine, "before_cursor_execute")
def _before_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info["query_start"] = time.monotonic()


@event.listens_for(engine, "after_cursor_execute")
def _after_execute(conn, cursor, statement, parameters, context, executemany):
    elapsed_ms = (time.monotonic() - conn.info.get("query_start", time.monotonic())) * 1000
    if elapsed_ms >= SLOW_QUERY_MS:
        # Log statement without parameters — parameters may contain user data
        logger.warning("SLOW QUERY %.1fms: %.200s", elapsed_ms, statement.replace("\n", " ").strip())


# --- pool metrics logging ---

@event.listens_for(engine, "checkout")
def _pool_checkout(dbapi_conn, conn_record, conn_proxy):
    pool = engine.pool
    logger.debug(
        "pool.checkout  size=%d checked_out=%d overflow=%d",
        pool.size(),
        pool.checkedout(),
        pool.overflow(),
    )


@event.listens_for(engine, "checkin")
def _pool_checkin(dbapi_conn, conn_record):
    pool = engine.pool
    logger.debug(
        "pool.checkin   size=%d checked_out=%d overflow=%d",
        pool.size(),
        pool.checkedout(),
        pool.overflow(),
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def pool_status() -> dict:
    """Snapshot of connection pool state — used by /api/health."""
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "checked_in": pool.checkedin(),
    }
