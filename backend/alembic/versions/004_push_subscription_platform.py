"""Add platform and fcm_token to push_subscriptions for native FCM."""

from alembic import context, op
import sqlalchemy as sa

revision = "004_push_subscription_platform"
down_revision = "003_preferences_monthly_budget"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with context.get_context().autocommit_block():
        bind = op.get_bind()
        insp = sa.inspect(bind)
        if not insp.has_table("push_subscriptions"):
            return
        cols = {c["name"] for c in insp.get_columns("push_subscriptions")}
        if "platform" not in cols:
            op.add_column(
                "push_subscriptions",
                sa.Column("platform", sa.String(length=16), nullable=False, server_default="web"),
            )
        if "fcm_token" not in cols:
            op.add_column("push_subscriptions", sa.Column("fcm_token", sa.Text(), nullable=True))
            op.create_index(
                "ix_push_subscriptions_fcm_token",
                "push_subscriptions",
                ["fcm_token"],
                unique=True,
            )
        for col in ("endpoint", "p256dh", "auth"):
            if col in cols:
                op.alter_column("push_subscriptions", col, existing_type=sa.Text(), nullable=True)


def downgrade() -> None:
    with context.get_context().autocommit_block():
        bind = op.get_bind()
        insp = sa.inspect(bind)
        if not insp.has_table("push_subscriptions"):
            return
        cols = {c["name"] for c in insp.get_columns("push_subscriptions")}
        if "fcm_token" in cols:
            op.drop_index("ix_push_subscriptions_fcm_token", table_name="push_subscriptions")
            op.drop_column("push_subscriptions", "fcm_token")
        if "platform" in cols:
            op.drop_column("push_subscriptions", "platform")
