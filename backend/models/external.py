"""
models/external.py — przyboczni (external users) i ich role, prefiks API_
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from database import Base

_uuid = lambda: str(uuid.uuid4())
_now  = lambda: datetime.now(timezone.utc)


class AppRole(Base):
    """Role i uprawnienia przybocznych (np. drużynowy, przyboczny)."""
    __tablename__ = "API_roles"

    id:          Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    name:        Mapped[str]            = mapped_column(String(100), unique=True, nullable=False)
    label:       Mapped[Optional[str]]  = mapped_column(String(255), nullable=True)
    permissions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"tasks":["view","create",...]}
    created_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)


class AppExternalUser(Base):
    """Przyboczni — użytkownicy bez konta głównego (logują się magic linkiem lub hasłem)."""
    __tablename__ = "API_external_users"

    id:              Mapped[str]            = mapped_column(String(36), primary_key=True, default=_uuid)
    email:           Mapped[str]            = mapped_column(String(255), unique=True, nullable=False)
    display_name:    Mapped[Optional[str]]  = mapped_column(String(255), nullable=True)
    phone:           Mapped[Optional[str]]  = mapped_column(String(20), nullable=True)
    role:            Mapped[Optional[str]]  = mapped_column(String(100), nullable=True)      # FK → API_roles.name
    invited_by:      Mapped[Optional[str]]  = mapped_column(String(36), nullable=True)       # FK → users.id
    magic_token:     Mapped[Optional[str]]  = mapped_column(String(255), unique=True, nullable=True)
    token_expires:   Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    session_token:         Mapped[Optional[str]]   = mapped_column(String(255), nullable=True)
    session_token_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    active:          Mapped[bool]           = mapped_column(Boolean, default=False)
    robert_enabled:  Mapped[bool]           = mapped_column(Boolean, default=False)
    password_hash:   Mapped[Optional[str]]  = mapped_column(String(255), nullable=True)      # bcrypt
    camp_id:         Mapped[Optional[str]]  = mapped_column(String(36), nullable=True, index=True)  # FK → camps.id
    last_login:      Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at:      Mapped[datetime]       = mapped_column(DateTime(timezone=True), default=_now)
