"""Add app_tasks, app_calendar_events, app_external_users, app_shared_files, app_ingredients, app_activity_log

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── app_roles ────────────────────────────────────────────────────────────
    op.create_table(
        "app_roles",
        sa.Column("id",          sa.String(36),  primary_key=True),
        sa.Column("name",        sa.String(100), nullable=False, unique=True),
        sa.Column("label",       sa.String(255), nullable=True),
        sa.Column("permissions", sa.JSON,        nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True)),
    )

    # ── app_external_users ────────────────────────────────────────────────────
    op.create_table(
        "app_external_users",
        sa.Column("id",             sa.String(36),  primary_key=True),
        sa.Column("email",          sa.String(255), nullable=False, unique=True),
        sa.Column("display_name",   sa.String(255), nullable=True),
        sa.Column("phone",          sa.String(50),  nullable=True),
        sa.Column("role",           sa.String(100), nullable=True),
        sa.Column("invited_by",     sa.String(36),  nullable=True),
        sa.Column("magic_token",    sa.String(255), nullable=True, unique=True),
        sa.Column("token_expires",  sa.DateTime(timezone=True), nullable=True),
        sa.Column("session_token",  sa.String(255), nullable=True),
        sa.Column("active",         sa.Boolean,     nullable=False, server_default="0"),
        sa.Column("robert_enabled", sa.Boolean,     nullable=False, server_default="0"),
        sa.Column("password_hash",  sa.String(255), nullable=True),
        sa.Column("camp_id",        sa.String(36),  nullable=True, index=True),
        sa.Column("last_login",     sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",     sa.DateTime(timezone=True)),
    )

    # ── app_tasks ────────────────────────────────────────────────────────────
    op.create_table(
        "app_tasks",
        sa.Column("id",          sa.String(36),  primary_key=True),
        sa.Column("camp_id",     sa.String(36),  nullable=False, index=True),
        sa.Column("title",       sa.String(255), nullable=False),
        sa.Column("description", sa.Text,        nullable=True),
        sa.Column("column",      sa.String(20),  nullable=False, server_default="todo"),
        sa.Column("priority",    sa.String(20),  nullable=False, server_default="medium"),
        sa.Column("deadline",    sa.DateTime(timezone=True), nullable=True),
        sa.Column("assigned_to", sa.String(36),  nullable=True),
        sa.Column("created_by",  sa.String(36),  nullable=True),
        sa.Column("notes",       sa.Text,        nullable=True),
        sa.Column("order",       sa.Integer,     nullable=False, server_default="0"),
        sa.Column("created_at",  sa.DateTime(timezone=True)),
        sa.Column("updated_at",  sa.DateTime(timezone=True)),
    )

    # ── app_task_checklists ───────────────────────────────────────────────────
    op.create_table(
        "app_task_checklists",
        sa.Column("id",         sa.String(36), primary_key=True),
        sa.Column("task_id",    sa.String(36), nullable=False, index=True),
        sa.Column("text",       sa.Text,       nullable=False),
        sa.Column("done",       sa.Boolean,    nullable=False, server_default="0"),
        sa.Column("done_by",    sa.String(36), nullable=True),
        sa.Column("done_at",    sa.DateTime(timezone=True), nullable=True),
        sa.Column("order",      sa.Integer,    nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )

    # ── app_task_comments ─────────────────────────────────────────────────────
    op.create_table(
        "app_task_comments",
        sa.Column("id",         sa.String(36), primary_key=True),
        sa.Column("task_id",    sa.String(36), nullable=False, index=True),
        sa.Column("user_type",  sa.String(20), nullable=False, server_default="internal"),
        sa.Column("user_id",    sa.String(36), nullable=True),
        sa.Column("content",    sa.Text,       nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )

    # ── app_task_attachments ──────────────────────────────────────────────────
    op.create_table(
        "app_task_attachments",
        sa.Column("id",          sa.String(36),  primary_key=True),
        sa.Column("task_id",     sa.String(36),  nullable=False, index=True),
        sa.Column("filename",    sa.String(255), nullable=False),
        sa.Column("path",        sa.Text,        nullable=False),
        sa.Column("size",        sa.Integer,     nullable=True),
        sa.Column("uploaded_by", sa.String(36),  nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True)),
    )

    # ── app_task_dependencies ─────────────────────────────────────────────────
    op.create_table(
        "app_task_dependencies",
        sa.Column("id",         sa.String(36), primary_key=True),
        sa.Column("task_id",    sa.String(36), nullable=False, index=True),
        sa.Column("depends_on", sa.String(36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("task_id", "depends_on", name="uq_task_dependency"),
    )

    # ── app_task_templates ────────────────────────────────────────────────────
    op.create_table(
        "app_task_templates",
        sa.Column("id",         sa.String(36),  primary_key=True),
        sa.Column("name",       sa.String(255), nullable=False, unique=True),
        sa.Column("created_by", sa.String(36),  nullable=True),
        sa.Column("tasks",      sa.JSON,        nullable=True),
        sa.Column("is_default", sa.Boolean,     nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )

    # ── app_calendar_events ───────────────────────────────────────────────────
    op.create_table(
        "app_calendar_events",
        sa.Column("id",          sa.String(36),  primary_key=True),
        sa.Column("camp_id",     sa.String(36),  nullable=False, index=True),
        sa.Column("title",       sa.String(255), nullable=False),
        sa.Column("description", sa.Text,        nullable=True),
        sa.Column("date_start",  sa.Date,        nullable=True),
        sa.Column("date_end",    sa.Date,        nullable=True),
        sa.Column("time_start",  sa.String(5),   nullable=True),
        sa.Column("time_end",    sa.String(5),   nullable=True),
        sa.Column("color",       sa.String(20),  nullable=False, server_default="#2d6a2d"),
        sa.Column("created_by",  sa.String(36),  nullable=True),
        sa.Column("task_id",     sa.String(36),  nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True)),
        sa.Column("updated_at",  sa.DateTime(timezone=True)),
    )

    # ── app_shared_files ──────────────────────────────────────────────────────
    op.create_table(
        "app_shared_files",
        sa.Column("id",          sa.String(36),  primary_key=True),
        sa.Column("filename",    sa.String(255), nullable=False),
        sa.Column("path",        sa.Text,        nullable=False),
        sa.Column("size",        sa.Integer,     nullable=True),
        sa.Column("mime_type",   sa.String(100), nullable=True),
        sa.Column("uploaded_by", sa.String(36),  nullable=True),
        sa.Column("camp_id",     sa.String(36),  nullable=False, index=True),
        sa.Column("task_id",     sa.String(36),  nullable=True),
        sa.Column("expires_at",  sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True)),
    )

    # ── app_ingredients ───────────────────────────────────────────────────────
    op.create_table(
        "app_ingredients",
        sa.Column("id",         sa.String(36),  primary_key=True),
        sa.Column("name",       sa.String(255), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )

    # ── app_activity_log ──────────────────────────────────────────────────────
    op.create_table(
        "app_activity_log",
        sa.Column("id",          sa.String(36),  primary_key=True),
        sa.Column("user_id",     sa.String(36),  nullable=True, index=True),
        sa.Column("user_type",   sa.String(20),  nullable=False, server_default="internal"),
        sa.Column("action",      sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50),  nullable=True),
        sa.Column("entity_id",   sa.String(36),  nullable=True),
        sa.Column("meta",        sa.JSON,        nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True)),
    )


def downgrade() -> None:
    op.drop_table("app_activity_log")
    op.drop_table("app_ingredients")
    op.drop_table("app_shared_files")
    op.drop_table("app_calendar_events")
    op.drop_table("app_task_templates")
    op.drop_table("app_task_dependencies")
    op.drop_table("app_task_attachments")
    op.drop_table("app_task_comments")
    op.drop_table("app_task_checklists")
    op.drop_table("app_tasks")
    op.drop_table("app_external_users")
    op.drop_table("app_roles")
