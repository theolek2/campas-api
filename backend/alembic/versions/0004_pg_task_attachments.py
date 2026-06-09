"""task attachments

Revision ID: 0004_pg_task_attachments
Revises: 0003_pg_map_state
Create Date: 2026-06-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0004_pg_task_attachments"
down_revision: Union[str, None] = "0003_pg_map_state"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("API_tasks", sa.Column("attachments", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("API_tasks", "attachments")
