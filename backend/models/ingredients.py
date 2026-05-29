"""
models/ingredients.py — składniki jadłospisu i log aktywności, prefiks API_
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from database import Base

_uuid = lambda: str(uuid.uuid4())
_now  = lambda: datetime.now(timezone.utc)


class AppIngredient(Base):
    """Składniki do jadłospisu (globalna lista)."""
    __tablename__ = "API_ingredients"

    id:         Mapped[str]      = mapped_column(String(36), primary_key=True, default=_uuid)
    name:       Mapped[str]      = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class AppActivityLog(Base):
    """Log aktywności użytkowników w aplikacji."""
    __tablename__ = "API_activity_log"

    id:          Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id:     Mapped[Optional[str]]  = mapped_column(String(36), nullable=True, index=True)
    user_type:   Mapped[str]            = mapped_column(String(20), default="internal")  # internal|external
    action:      Mapped[str]            = mapped_column(String(100), nullable=False)     # np. "task_move_done"
    entity_type: Mapped[Optional[str]]  = mapped_column(String(50), nullable=True)
    entity_id:   Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)
    meta:        Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
