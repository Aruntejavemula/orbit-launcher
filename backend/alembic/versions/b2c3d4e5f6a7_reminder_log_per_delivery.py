"""reminder_log per app and channel

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("uq_reminder_log_user_day", "reminder_logs", type_="unique")
    op.add_column("reminder_logs", sa.Column("app_id", sa.UUID(), nullable=True))
    op.add_column("reminder_logs", sa.Column("channel", sa.String(length=10), nullable=True))
    op.execute("DELETE FROM reminder_logs")
    op.alter_column("reminder_logs", "app_id", nullable=False)
    op.alter_column("reminder_logs", "channel", nullable=False)
    op.create_foreign_key(
        "fk_reminder_logs_app_id",
        "reminder_logs",
        "apps",
        ["app_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_unique_constraint(
        "uq_reminder_log_delivery",
        "reminder_logs",
        ["user_id", "app_id", "days_before", "channel", "sent_date"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_reminder_log_delivery", "reminder_logs", type_="unique")
    op.drop_constraint("fk_reminder_logs_app_id", "reminder_logs", type_="foreignkey")
    op.drop_column("reminder_logs", "channel")
    op.drop_column("reminder_logs", "app_id")
    op.create_unique_constraint(
        "uq_reminder_log_user_day",
        "reminder_logs",
        ["user_id", "days_before", "sent_date"],
    )
