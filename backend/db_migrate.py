"""Run Alembic migrations (used at app startup and in Docker entrypoint)."""

from __future__ import annotations

import logging
import os

from alembic import command
from alembic.config import Config

logger = logging.getLogger("orbit.db")


def run_migrations() -> None:
    if os.getenv("RUN_MIGRATIONS", "true").lower() in ("0", "false", "no"):
        logger.info("RUN_MIGRATIONS disabled — skipping Alembic upgrade")
        return
    root = os.path.dirname(os.path.abspath(__file__))
    cfg = Config(os.path.join(root, "alembic.ini"))
    command.upgrade(cfg, "head")
    logger.info("Database migrations applied (alembic head)")
