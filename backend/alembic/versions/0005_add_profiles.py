"""Add profiles table for user metadata and camp data

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id",           sa.String(36), primary_key=True),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("organization", sa.String(255), nullable=True),
        sa.Column("phone",        sa.String(20), nullable=True),
        sa.Column("camp_meta",    sa.JSON, nullable=True),
        sa.Column("created_at",   sa.DateTime(timezone=True)),
    )


def downgrade() -> None:
    op.drop_table("profiles")
