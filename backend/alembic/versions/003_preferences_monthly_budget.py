"""Add preferences.monthly_budget for onboarding budget step."""

from alembic import context, op
import sqlalchemy as sa

revision = "003_preferences_monthly_budget"
down_revision = "002_ensure_launch_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with context.get_context().autocommit_block():
        bind = op.get_bind()
        insp = sa.inspect(bind)
        if not insp.has_table("preferences"):
            return
        cols = {c["name"] for c in insp.get_columns("preferences")}
        if "monthly_budget" not in cols:
            op.add_column("preferences", sa.Column("monthly_budget", sa.Integer(), nullable=True))


def downgrade() -> None:
    with context.get_context().autocommit_block():
        bind = op.get_bind()
        insp = sa.inspect(bind)
        if not insp.has_table("preferences"):
            return
        cols = {c["name"] for c in insp.get_columns("preferences")}
        if "monthly_budget" in cols:
            op.drop_column("preferences", "monthly_budget")
