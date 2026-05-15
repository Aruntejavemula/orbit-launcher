"""Sync DB schema with models — idempotent, safe outside a single PG transaction."""

from typing import Set

import sqlalchemy as sa
from alembic import context, op

revision = "001_sync_schema"
down_revision = None
branch_labels = None
depends_on = None


def _existing_columns(insp: sa.Inspector, table: str) -> Set[str]:
    if not insp.has_table(table):
        return set()
    return {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    import models  # noqa: F401
    from database import Base

    # ALTER TYPE / create_all with enums must not run inside Alembic's default transaction.
    with context.get_context().autocommit_block():
        bind = op.get_bind()
        Base.metadata.create_all(bind=bind)
        insp = sa.inspect(bind)

        if insp.has_table("apps"):
            cols = _existing_columns(insp, "apps")
            if "monthly_cost" not in cols:
                op.add_column("apps", sa.Column("monthly_cost", sa.Numeric(10, 2), nullable=True))
            if "pending_unsubscribe_at" not in cols:
                op.add_column(
                    "apps",
                    sa.Column("pending_unsubscribe_at", sa.DateTime(timezone=True), nullable=True),
                )
            if "icon_key" not in cols:
                op.add_column("apps", sa.Column("icon_key", sa.String(80), nullable=True))

        if insp.has_table("users"):
            cols = _existing_columns(insp, "users")
            if "subscription_status" not in cols:
                op.execute(
                    "DO $$ BEGIN "
                    "CREATE TYPE subscriptionstatusenum AS ENUM ('active', 'canceled', 'trialing'); "
                    "EXCEPTION WHEN duplicate_object THEN NULL; "
                    "END $$;"
                )
                op.add_column(
                    "users",
                    sa.Column(
                        "subscription_status",
                        sa.Enum("active", "canceled", "trialing", name="subscriptionstatusenum"),
                        nullable=False,
                        server_default="trialing",
                    ),
                )
            if "token_version" not in cols:
                op.add_column(
                    "users",
                    sa.Column("token_version", sa.Integer(), nullable=False, server_default="0"),
                )

        if insp.has_table("preferences"):
            cols = _existing_columns(insp, "preferences")
            if "country" not in cols:
                op.add_column(
                    "preferences",
                    sa.Column("country", sa.String(2), nullable=False, server_default=""),
                )
            if "onboarding_completed" not in cols:
                op.add_column(
                    "preferences",
                    sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
                )


def downgrade() -> None:
    pass
