"""
models/tasks.py — tablice zadań (Kanban) z prefiksem API_
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Text, JSON, Boolean, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from database import Base

_uuid = lambda: str(uuid.uuid4())
_now  = lambda: datetime.now(timezone.utc)


class AppTask(Base):
    __tablename__ = "API_tasks"

    id:          Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    camp_id:     Mapped[str]            = mapped_column(String(36), nullable=False, index=True)
    title:       Mapped[str]            = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    column:      Mapped[str]            = mapped_column(String(20), default="todo")
    priority:    Mapped[str]            = mapped_column(String(20), default="medium")
    deadline:    Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    assigned_to: Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)
    created_by:  Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)
    notes:       Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    order:       Mapped[int]            = mapped_column(Integer, default=0)
    created_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class AppTaskChecklist(Base):
    __tablename__ = "API_task_checklists"

    id:       Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    task_id:  Mapped[str]            = mapped_column(String(36), nullable=False, index=True)
    text:     Mapped[str]            = mapped_column(Text, nullable=False)
    done:     Mapped[bool]           = mapped_column(Boolean, default=False)
    done_by:  Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)
    done_at:  Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    order:    Mapped[int]            = mapped_column(Integer, default=0)
    created_at: Mapped[datetime]     = mapped_column(DateTime(timezone=True), default=_now)


class AppTaskComment(Base):
    __tablename__ = "API_task_comments"

    id:         Mapped[str]           = mapped_column(String(36), primary_key=True, default=_uuid)
    task_id:    Mapped[str]           = mapped_column(String(36), nullable=False, index=True)
    user_type:  Mapped[str]           = mapped_column(String(20), default="internal")
    user_id:    Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    content:    Mapped[str]           = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=_now)


class AppTaskAttachment(Base):
    __tablename__ = "API_task_attachments"

    id:          Mapped[str]           = mapped_column(String(36), primary_key=True, default=_uuid)
    task_id:     Mapped[str]           = mapped_column(String(36), nullable=False, index=True)
    filename:    Mapped[str]           = mapped_column(String(255), nullable=False)
    path:        Mapped[str]           = mapped_column(Text, nullable=False)
    size:        Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    uploaded_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_at:  Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=_now)


class AppTaskDependency(Base):
    __tablename__ = "API_task_dependencies"
    __table_args__ = (UniqueConstraint("task_id", "depends_on"),)

    id:         Mapped[str]      = mapped_column(String(36), primary_key=True, default=_uuid)
    task_id:    Mapped[str]      = mapped_column(String(36), nullable=False, index=True)
    depends_on: Mapped[str]      = mapped_column(String(36), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class AppTaskTemplate(Base):
    __tablename__ = "API_task_templates"

    id:         Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    name:       Mapped[str]            = mapped_column(String(255), unique=True, nullable=False)
    created_by: Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)
    tasks:      Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_default: Mapped[bool]           = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
