"""
models/shared.py — tabele współdzielone z swi.campas.pl.
NIE dodawaj tutaj tabel API_* — tylko czytaj/zapisuj istniejące.
Tabele te JUŻ ISTNIEJĄ w bazie PostgreSQL — NIE są tworzone przez migracje campas-api.
"""
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Date, DateTime, Text, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from database import Base

_uuid = lambda: str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id:                     Mapped[str]                = mapped_column(String(36), primary_key=True, default=_uuid)
    email:                  Mapped[str]                = mapped_column(String(255), unique=True, nullable=False)
    password_hash:          Mapped[str]                = mapped_column(String(255), nullable=False)
    display_name:           Mapped[Optional[str]]      = mapped_column(String(255))
    role:                   Mapped[str]                = mapped_column(String(20), default="user")
    created_at:             Mapped[datetime]           = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    email_verified:         Mapped[bool]               = mapped_column(Boolean, default=False)
    verification_token:     Mapped[Optional[str]]      = mapped_column(String(255), nullable=True)
    verification_token_exp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reset_token:            Mapped[Optional[str]]      = mapped_column(String(255), nullable=True)
    reset_token_exp:        Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Camp(Base):
    __tablename__ = "camps"

    id:         Mapped[str]                = mapped_column(String(36), primary_key=True, default=_uuid)
    unit_name:  Mapped[Optional[str]]      = mapped_column(String(255))
    date_start: Mapped[date]               = mapped_column(Date)
    date_end:   Mapped[date]               = mapped_column(Date)
    terrain_id: Mapped[Optional[str]]      = mapped_column(String(36))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class Patrol(Base):
    __tablename__ = "patrols"

    id:            Mapped[str]           = mapped_column(String(36), primary_key=True, default=_uuid)
    camp_id:       Mapped[Optional[str]] = mapped_column(String(36))
    patrol_name:   Mapped[Optional[str]] = mapped_column(String(100))
    people_number: Mapped[Optional[int]] = mapped_column(Integer)


class CampAccess(Base):
    __tablename__ = "camp_access"

    id:          Mapped[str]           = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id:     Mapped[str]           = mapped_column(PG_UUID(as_uuid=False))
    camp_id:     Mapped[Optional[str]] = mapped_column(PG_UUID(as_uuid=False))
    permissions: Mapped[Optional[str]] = mapped_column(String(50))


class CampInvitation(Base):
    __tablename__ = "camp_invitations"

    id:         Mapped[str]                = mapped_column(String(32), primary_key=True, default=_uuid)
    camp_id:    Mapped[str]                = mapped_column(String(32))
    email:      Mapped[Optional[str]]      = mapped_column(String(255), nullable=True)
    invited_by: Mapped[str]                = mapped_column(String(32))
    token:      Mapped[str]                = mapped_column(String(255), unique=True, nullable=False)
    type:       Mapped[str]                = mapped_column(String(10), default="single")
    created_at: Mapped[datetime]           = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at: Mapped[datetime]           = mapped_column(DateTime(timezone=True))
    used_at:    Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Terrain(Base):
    __tablename__ = "terrains"

    id:             Mapped[str]            = mapped_column(String(36), primary_key=True)
    name:           Mapped[str]            = mapped_column(String(255))
    lat:            Mapped[Optional[float]] = mapped_column(nullable=True)
    lng:            Mapped[Optional[float]] = mapped_column(nullable=True)
    address:        Mapped[Optional[str]]  = mapped_column(String(500), nullable=True)
    owner_name:     Mapped[Optional[str]]  = mapped_column(String(200), nullable=True)
    owner_contact:  Mapped[Optional[str]]  = mapped_column(String(20), nullable=True)
    owner_notes:    Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    is_public:      Mapped[bool]           = mapped_column(Boolean, default=True)


class Profile(Base):
    __tablename__ = "profiles"

    id:           Mapped[str]            = mapped_column(String(36), primary_key=True)
    display_name: Mapped[Optional[str]]  = mapped_column(String(255), nullable=True)
    organization: Mapped[Optional[str]]  = mapped_column(String(255), nullable=True)
    phone:        Mapped[Optional[str]]  = mapped_column(String(20), nullable=True)
    camp_meta:    Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at:   Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
