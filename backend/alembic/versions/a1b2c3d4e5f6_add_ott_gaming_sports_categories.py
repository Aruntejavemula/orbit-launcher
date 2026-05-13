"""add ott, gaming, sports categories

Revision ID: a1b2c3d4e5f6
Revises: 73962bb91a62
Create Date: 2026-05-13 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '73962bb91a62'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE categoryenum ADD VALUE IF NOT EXISTS 'ott'")
    op.execute("ALTER TYPE categoryenum ADD VALUE IF NOT EXISTS 'gaming'")
    op.execute("ALTER TYPE categoryenum ADD VALUE IF NOT EXISTS 'sports'")


def downgrade() -> None:
    pass
