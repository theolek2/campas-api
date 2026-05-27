"""Constrain Text columns to String(N) for PSQL compatibility

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite nie wspiera ALTER COLUMN TYPE — pomijamy
    bind = op.get_bind()
    if bind.engine.name == "sqlite":
        return

    # PostgreSQL
    op.alter_column("camps",        "unit_name",   type_=sa.String(255), existing_type=sa.Text())
    op.alter_column("patrols",      "patrol_name",  type_=sa.String(100), existing_type=sa.Text())
    op.alter_column("camp_access",  "permissions",  type_=sa.String(50),  existing_type=sa.Text())
    op.alter_column("terrains",     "name",         type_=sa.String(255), existing_type=sa.Text())
    op.alter_column("app_participants", "address",  type_=sa.String(500), existing_type=sa.Text())
    op.alter_column("app_external_users", "phone",  type_=sa.String(20),  existing_type=sa.String(50))


def downgrade() -> None:
    bind = op.get_bind()
    if bind.engine.name == "sqlite":
        return

    op.alter_column("camps",        "unit_name",   type_=sa.Text(), existing_type=sa.String(255))
    op.alter_column("patrols",      "patrol_name",  type_=sa.Text(), existing_type=sa.String(100))
    op.alter_column("camp_access",  "permissions",  type_=sa.Text(), existing_type=sa.String(50))
    op.alter_column("terrains",     "name",         type_=sa.Text(), existing_type=sa.String(255))
    op.alter_column("app_participants", "address",  type_=sa.Text(), existing_type=sa.String(500))
    op.alter_column("app_external_users", "phone",  type_=sa.String(50), existing_type=sa.String(20))
