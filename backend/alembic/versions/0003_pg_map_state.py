"""Add map_state JSONB to camps

Revision ID: 0003_pg_map_state
Revises: 0002_pg_camp_fields
Create Date: 2026-06-04
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0003_pg_map_state"
down_revision: Union[str, None] = "0002_pg_camp_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("camps", sa.Column("map_state", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("camps", "map_state")
