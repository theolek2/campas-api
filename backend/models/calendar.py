"""
models/calendar.py — kalendarz obozowy z prefiksem API_
"""
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Date, Text
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from database import Base

_uuid = lambda: str(uuid.uuid4())
_now  = lambda: datetime.now(timezone.utc)


class AppCalendarEvent(Base):
    __tablename__ = "API_calendar_events"

    id:          Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    camp_id:     Mapped[str]            = mapped_column(String(36), nullable=False, index=True)
    title:       Mapped[str]            = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    date_start:  Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    date_end:    Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    time_start:  Mapped[Optional[str]]  = mapped_column(String(5), nullable=True)   # "HH:MM"
    time_end:    Mapped[Optional[str]]  = mapped_column(String(5), nullable=True)
    color:       Mapped[str]            = mapped_column(String(20), default="#2d6a2d")
    created_by:  Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)
    task_id:     Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)  # FK → API_tasks.id
    created_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
