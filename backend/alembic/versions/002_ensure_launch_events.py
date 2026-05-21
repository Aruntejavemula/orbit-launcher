"""Ensure launch_events exists for Activity (open counts / timeline).

Idempotent: safe if 001_sync_schema already created the table via create_all.
Backfills one launch row per app from last_opened_at when history is empty.
"""

from alembic import context, op
import sqlalchemy as sa

revision = "002_ensure_launch_events"
down_revision = "001_sync_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    from models.launch_event import LaunchEvent  # noqa: F401 — register metadata

    with context.get_context().autocommit_block():
        bind = op.get_bind()
        LaunchEvent.__table__.create(bind=bind, checkfirst=True)

        # Existing users: seed one event from last_opened_at so Activity isn't all zeros.
        # Skip if last_opened_at is older than 90d (matches ck_launch_events_retention_90d).
        op.execute(
            sa.text(
                """
                INSERT INTO launch_events (id, user_id, app_id, launched_at)
                SELECT gen_random_uuid(), a.user_id, a.id, a.last_opened_at
                FROM apps a
                WHERE a.last_opened_at IS NOT NULL
                  AND a.is_deleted = false
                  AND a.last_opened_at >= (NOW() - INTERVAL '90 days')
                  AND NOT EXISTS (
                    SELECT 1 FROM launch_events le WHERE le.app_id = a.id
                  )
                """
            )
        )


def downgrade() -> None:
    pass
