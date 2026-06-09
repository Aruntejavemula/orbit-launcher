"""Add app_id and channel to reminder_logs; replace unique constraint."""

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "005_reminder_log_app_id_channel"
down_revision = "004_push_subscription_platform"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with context.get_context().autocommit_block():
        bind = op.get_bind()
        insp = sa.inspect(bind)

        if not insp.has_table("reminder_logs"):
            return

        cols = {c["name"] for c in insp.get_columns("reminder_logs")}

        # Add columns as nullable first so existing rows don't violate NOT NULL.
        if "app_id" not in cols:
            op.add_column("reminder_logs", sa.Column("app_id", UUID(as_uuid=True), nullable=True))
        if "channel" not in cols:
            op.add_column(
                "reminder_logs",
                sa.Column("channel", sa.String(10), nullable=True, server_default="email"),
            )

        # Truncate — this table is a deduplication log for a feature that was
        # never working (no app_id column). Any existing rows are stale noise.
        op.execute("TRUNCATE reminder_logs")

        # Now enforce NOT NULL.
        op.alter_column("reminder_logs", "app_id", nullable=False)
        op.alter_column("reminder_logs", "channel", nullable=False)

        # Add FK for app_id if missing.
        constraints = {c["name"] for c in insp.get_foreign_keys("reminder_logs")}
        if "fk_reminder_logs_app_id" not in constraints:
            op.create_foreign_key(
                "fk_reminder_logs_app_id",
                "reminder_logs",
                "apps",
                ["app_id"],
                ["id"],
                ondelete="CASCADE",
            )

        # Add index on app_id if missing.
        indexes = {i["name"] for i in insp.get_indexes("reminder_logs")}
        if "ix_reminder_logs_app_id" not in indexes:
            op.create_index("ix_reminder_logs_app_id", "reminder_logs", ["app_id"])

        # Drop old unique constraint (no app_id / channel).
        existing_uq = {c["name"] for c in insp.get_unique_constraints("reminder_logs")}
        if "uq_reminder_log_user_day" in existing_uq:
            op.drop_constraint("uq_reminder_log_user_day", "reminder_logs", type_="unique")

        # Create new unique constraint if missing.
        if "uq_reminder_log_delivery" not in existing_uq:
            op.create_unique_constraint(
                "uq_reminder_log_delivery",
                "reminder_logs",
                ["user_id", "app_id", "days_before", "channel", "sent_date"],
            )


def downgrade() -> None:
    with context.get_context().autocommit_block():
        bind = op.get_bind()
        insp = sa.inspect(bind)

        if not insp.has_table("reminder_logs"):
            return

        existing_uq = {c["name"] for c in insp.get_unique_constraints("reminder_logs")}
        if "uq_reminder_log_delivery" in existing_uq:
            op.drop_constraint("uq_reminder_log_delivery", "reminder_logs", type_="unique")

        indexes = {i["name"] for i in insp.get_indexes("reminder_logs")}
        if "ix_reminder_logs_app_id" in indexes:
            op.drop_index("ix_reminder_logs_app_id", table_name="reminder_logs")

        op.execute("TRUNCATE reminder_logs")

        cols = {c["name"] for c in insp.get_columns("reminder_logs")}
        if "channel" in cols:
            op.drop_column("reminder_logs", "channel")
        if "app_id" in cols:
            op.drop_column("reminder_logs", "app_id")

        if "uq_reminder_log_user_day" not in existing_uq:
            op.create_unique_constraint(
                "uq_reminder_log_user_day",
                "reminder_logs",
                ["user_id", "days_before", "sent_date"],
            )
