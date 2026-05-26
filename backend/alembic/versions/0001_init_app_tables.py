"""Init app_ tables

Revision ID: 0001
Revises:
Create Date: 2026-05-26

Tworzy własne tabele api.campas.pl (prefiks app_).
Tabele współdzielone (users, camps, etc.) są zarządzane przez swi.campas.pl.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "app_documents",
        sa.Column("id",         sa.String(36),  primary_key=True),
        sa.Column("camp_id",    sa.String(36),  nullable=False, index=True),
        sa.Column("created_by", sa.String(36),  nullable=False),
        sa.Column("type",       sa.String(64),  nullable=False),
        sa.Column("title",      sa.String(255), nullable=False),
        sa.Column("content",    sa.JSON,        nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "app_plan_items",
        sa.Column("id",          sa.String(36),  primary_key=True),
        sa.Column("camp_id",     sa.String(36),  nullable=False, index=True),
        sa.Column("created_by",  sa.String(36),  nullable=False),
        sa.Column("day_date",    sa.Date,        nullable=True),
        sa.Column("time_start",  sa.String(5),   nullable=True),
        sa.Column("time_end",    sa.String(5),   nullable=True),
        sa.Column("title",       sa.String(255), nullable=False),
        sa.Column("description", sa.Text,        nullable=True),
        sa.Column("category",    sa.String(64),  nullable=True),
        sa.Column("patrol_id",   sa.String(36),  nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True)),
        sa.Column("updated_at",  sa.DateTime(timezone=True)),
    )

    op.create_table(
        "app_participants",
        sa.Column("id",           sa.String(36),  primary_key=True),
        sa.Column("camp_id",      sa.String(36),  nullable=False, index=True),
        sa.Column("patrol_id",    sa.String(36),  nullable=True),
        sa.Column("first_name",   sa.String(100), nullable=False),
        sa.Column("last_name",    sa.String(100), nullable=False),
        sa.Column("birth_date",   sa.Date,        nullable=True),
        sa.Column("pesel",        sa.String(11),  nullable=True),
        sa.Column("address",      sa.Text,        nullable=True),
        sa.Column("parent_name",  sa.String(200), nullable=True),
        sa.Column("parent_phone", sa.String(20),  nullable=True),
        sa.Column("notes",        sa.Text,        nullable=True),
        sa.Column("created_at",   sa.DateTime(timezone=True)),
    )


def downgrade() -> None:
    op.drop_table("app_participants")
    op.drop_table("app_plan_items")
    op.drop_table("app_documents")
