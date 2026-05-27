"""
models/app.py — własne tabele api.campas.pl z prefiksem app_
Dodawane WYŁĄCZNIE przez migracje Alembic — nigdy ręcznie.
"""
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, Date, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from database import Base

_uuid = lambda: str(uuid.uuid4())
_now  = lambda: datetime.now(timezone.utc)


class AppDocument(Base):
    """Wygenerowane dokumenty obozowe (harmonogram, lista uczestników, itp.)."""
    __tablename__ = "app_documents"

    id:         Mapped[str]            = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
    camp_id:    Mapped[str]            = mapped_column(PG_UUID(as_uuid=False), nullable=False, index=True)
    created_by: Mapped[str]            = mapped_column(PG_UUID(as_uuid=False), nullable=False)
    type:       Mapped[str]            = mapped_column(String(64), nullable=False)
    title:      Mapped[str]            = mapped_column(String(255), nullable=False)
    content:    Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class AppPlanItem(Base):
    """Element harmonogramu dnia obozowego."""
    __tablename__ = "app_plan_items"

    id:          Mapped[str]            = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
    camp_id:     Mapped[str]            = mapped_column(PG_UUID(as_uuid=False), nullable=False, index=True)
    created_by:  Mapped[str]            = mapped_column(PG_UUID(as_uuid=False), nullable=False)
    day_date:    Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    time_start:  Mapped[Optional[str]]  = mapped_column(String(5), nullable=True)   # "HH:MM"
    time_end:    Mapped[Optional[str]]  = mapped_column(String(5), nullable=True)
    title:       Mapped[str]            = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    category:    Mapped[Optional[str]]  = mapped_column(String(64), nullable=True)
    patrol_id:   Mapped[Optional[str]]  = mapped_column(PG_UUID(as_uuid=False), nullable=True)
    created_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class AppParticipant(Base):
    """Uczestnik obozu (harcerz/uczestnik)."""
    __tablename__ = "app_participants"

    id:           Mapped[str]            = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
    camp_id:      Mapped[str]            = mapped_column(PG_UUID(as_uuid=False), nullable=False, index=True)
    patrol_id:    Mapped[Optional[str]]  = mapped_column(PG_UUID(as_uuid=False), nullable=True)
    first_name:   Mapped[str]            = mapped_column(String(100), nullable=False)
    last_name:    Mapped[str]            = mapped_column(String(100), nullable=False)
    birth_date:   Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    pesel:        Mapped[Optional[str]]  = mapped_column(String(11), nullable=True)
    address:      Mapped[Optional[str]]  = mapped_column(String(500), nullable=True)
    parent_name:  Mapped[Optional[str]]  = mapped_column(String(200), nullable=True)
    parent_phone: Mapped[Optional[str]]  = mapped_column(String(20), nullable=True)
    notes:        Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    created_at:   Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
