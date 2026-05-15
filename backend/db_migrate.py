"""Run Alembic migrations (used at app startup and in Docker entrypoint)."""

from __future__ import annotations

import logging
import os

from alembic import command
from alembic.config import Config

logger = logging.getLogger("orbit.db")


def run_migrations() -> bool:
    """Run Alembic upgrade. Returns True on success, False on failure (logged)."""
    if os.getenv("RUN_MIGRATIONS", "true").lower() in ("0", "false", "no"):
        logger.info("RUN_MIGRATIONS disabled — skipping Alembic upgrade")
        return True
    root = os.path.dirname(os.path.abspath(__file__))
    cfg = Config(os.path.join(root, "alembic.ini"))
    try:
        command.upgrade(cfg, "head")
        logger.info("Database migrations applied (alembic head)")
        return True
    except Exception:
        logger.exception("Alembic upgrade failed")
        return False
