"""Add lat, lng, address, owner columns to terrains

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for col in [
        sa.Column("lat",          sa.Float, nullable=True),
        sa.Column("lng",          sa.Float, nullable=True),
        sa.Column("address",      sa.String(500), nullable=True),
        sa.Column("owner_name",   sa.String(200), nullable=True),
        sa.Column("owner_contact", sa.String(20), nullable=True),
        sa.Column("owner_notes",  sa.Text, nullable=True),
        sa.Column("is_public",    sa.Boolean, server_default=sa.text("true"), nullable=False),
    ]:
        op.add_column("terrains", col)


def downgrade() -> None:
    for col in ["is_public", "owner_notes", "owner_contact", "owner_name", "address", "lng", "lat"]:
        op.drop_column("terrains", col)
