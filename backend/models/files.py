"""
models/files.py — pliki współdzielone obozu, prefiks app_
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from database import Base

_uuid = lambda: str(uuid.uuid4())
_now  = lambda: datetime.now(timezone.utc)


class AppSharedFile(Base):
    """Pliki wrzucone do dropboxa obozowego (zamiast Supabase Storage)."""
    __tablename__ = "app_shared_files"

    id:          Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    filename:    Mapped[str]            = mapped_column(String(255), nullable=False)
    path:        Mapped[str]            = mapped_column(Text, nullable=False)            # ścieżka lokalna w /data/uploads/
    size:        Mapped[Optional[int]]  = mapped_column(Integer, nullable=True)          # bajty
    mime_type:   Mapped[Optional[str]]  = mapped_column(String(100), nullable=True)
    uploaded_by: Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)
    camp_id:     Mapped[str]            = mapped_column(String(36), nullable=False, index=True)
    task_id:     Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)       # FK → app_tasks.id (opcjonalne)
    expires_at:  Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
