"""
models/app.py — własne tabele campas.pl z prefiksem API_
"""
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, Date, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from database import Base

_uuid = lambda: str(uuid.uuid4())
_now  = lambda: datetime.now(timezone.utc)


class AppDocument(Base):
    __tablename__ = "API_documents"

    id:         Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    camp_id:    Mapped[str]            = mapped_column(String(36), nullable=False, index=True)
    created_by: Mapped[str]            = mapped_column(String(36), nullable=False)
    type:       Mapped[str]            = mapped_column(String(64), nullable=False)
    title:      Mapped[str]            = mapped_column(String(255), nullable=False)
    content:    Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class AppPlanItem(Base):
    __tablename__ = "API_plan_items"

    id:          Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    camp_id:     Mapped[str]            = mapped_column(String(36), nullable=False, index=True)
    created_by:  Mapped[str]            = mapped_column(String(36), nullable=False)
    day_date:    Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    time_start:  Mapped[Optional[str]]  = mapped_column(String(5), nullable=True)
    time_end:    Mapped[Optional[str]]  = mapped_column(String(5), nullable=True)
    title:       Mapped[str]            = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    category:    Mapped[Optional[str]]  = mapped_column(String(64), nullable=True)
    patrol_id:   Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)
    created_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
    updated_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class AppParticipant(Base):
    __tablename__ = "API_participants"

    id:           Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    camp_id:      Mapped[str]            = mapped_column(String(36), nullable=False, index=True)
    patrol_id:    Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)
    first_name:   Mapped[str]            = mapped_column(String(100), nullable=False)
    last_name:    Mapped[str]            = mapped_column(String(100), nullable=False)
    birth_date:   Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    pesel:        Mapped[Optional[str]]  = mapped_column(String(11), nullable=True)
    address:      Mapped[Optional[str]]  = mapped_column(String(500), nullable=True)
    parent_name:  Mapped[Optional[str]]  = mapped_column(String(200), nullable=True)
    parent_phone: Mapped[Optional[str]]  = mapped_column(String(20), nullable=True)
    notes:        Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    created_at:   Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
