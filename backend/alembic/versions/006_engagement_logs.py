"""Create engagement_logs table for weekly/bi-weekly push notifications."""

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "006_engagement_logs"
down_revision = "005_reminder_log_app_id_channel"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with context.get_context().autocommit_block():
        bind = op.get_bind()
        insp = sa.inspect(bind)

        if insp.has_table("engagement_logs"):
            return

        op.create_table(
            "engagement_logs",
            sa.Column("id", UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "user_id",
                UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("type", sa.String(30), nullable=False),
            sa.Column("sent_date", sa.Date(), nullable=False),
            sa.UniqueConstraint("user_id", "type", "sent_date", name="uq_engagement_log_delivery"),
        )
        op.create_index("ix_engagement_logs_user_id", "engagement_logs", ["user_id"])


def downgrade() -> None:
    with context.get_context().autocommit_block():
        bind = op.get_bind()
        insp = sa.inspect(bind)

        if not insp.has_table("engagement_logs"):
            return

        op.drop_index("ix_engagement_logs_user_id", table_name="engagement_logs")
        op.drop_table("engagement_logs")
