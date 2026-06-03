"""
models/shared.py — tabele współdzielone z swi.campas.pl.
NIE dodawaj tutaj tabel API_* — tylko czytaj/zapisuj istniejące.
Tabele te JUŻ ISTNIEJĄ w bazie PostgreSQL — NIE są tworzone przez migracje campas-api.
"""
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Date, DateTime, Text, Integer, JSON, Float
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from database import Base

_uuid = lambda: str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id:                     Mapped[str]                = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
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

    # ── Dane obozu (z meta) ──
    kierownik:          Mapped[Optional[str]]      = mapped_column(String(255))
    miejsce:            Mapped[Optional[str]]      = mapped_column(String(500))
    termin:             Mapped[Optional[str]]      = mapped_column(String(255))
    tel_kierownik:      Mapped[Optional[str]]      = mapped_column(String(20))
    email:              Mapped[Optional[str]]      = mapped_column(String(255))
    powiat:             Mapped[Optional[str]]      = mapped_column(String(100))
    gmina:              Mapped[Optional[str]]      = mapped_column(String(100))
    wojewodztwo:        Mapped[Optional[str]]      = mapped_column(String(100))
    hufiec:             Mapped[Optional[str]]      = mapped_column(String(255))
    typ_obozu:          Mapped[Optional[str]]      = mapped_column(String(100))
    nadlesnictwo:       Mapped[Optional[str]]      = mapped_column(String(255))
    lesnictwo:          Mapped[Optional[str]]      = mapped_column(String(255))
    oddzial_lesny:      Mapped[Optional[str]]      = mapped_column(String(255))
    bezp_adres:         Mapped[Optional[str]]      = mapped_column(String(500))
    bezp_budynek:       Mapped[Optional[str]]      = mapped_column(String(255))
    bezp_miejscowosc:   Mapped[Optional[str]]      = mapped_column(String(255))
    lekarz:             Mapped[Optional[str]]      = mapped_column(String(255))
    szpital:            Mapped[Optional[str]]      = mapped_column(String(500))
    tel_szpital:        Mapped[Optional[str]]      = mapped_column(String(20))
    przychodnia:        Mapped[Optional[str]]      = mapped_column(String(500))
    tel_przychodnia:    Mapped[Optional[str]]      = mapped_column(String(20))
    psp:                Mapped[Optional[str]]      = mapped_column(String(500))
    psp_tel:            Mapped[Optional[str]]      = mapped_column(String(20))
    policja:            Mapped[Optional[str]]      = mapped_column(String(500))
    policja_tel:        Mapped[Optional[str]]      = mapped_column(String(20))
    komendant_tel:      Mapped[Optional[str]]      = mapped_column(String(20))
    tel_zastepca:       Mapped[Optional[str]]      = mapped_column(String(20))
    nr_zgloszenia:      Mapped[Optional[str]]      = mapped_column(String(100))
    data_zgloszenia:    Mapped[Optional[str]]      = mapped_column(String(100))
    uwagi:              Mapped[Optional[str]]      = mapped_column(Text)
    schronienie:        Mapped[Optional[str]]      = mapped_column(String(500))
    kontakt1:           Mapped[Optional[str]]      = mapped_column(String(500))
    kontakt2:           Mapped[Optional[str]]      = mapped_column(String(500))
    tel_kontakt1:       Mapped[Optional[str]]      = mapped_column(String(20))
    tel_kontakt2:       Mapped[Optional[str]]      = mapped_column(String(20))
    uczestnicy:         Mapped[Optional[int]]      = mapped_column(Integer)
    liczba_kadry:       Mapped[Optional[int]]      = mapped_column(Integer)
    wiek:               Mapped[Optional[str]]      = mapped_column(String(50))

    # ── JSONB — zagnieżdżone dane z meta ──
    coords:             Mapped[Optional[dict]]     = mapped_column(JSONB)
    wychowawcy:         Mapped[Optional[list]]     = mapped_column(JSONB)
    nr_dzialki:         Mapped[Optional[list]]     = mapped_column(JSONB)

    # ── JSONB — stan aplikacji ──
    days_json:          Mapped[Optional[list]]     = mapped_column(JSONB)
    activities_json:    Mapped[Optional[list]]     = mapped_column(JSONB)
    template_json:      Mapped[Optional[list]]     = mapped_column(JSONB)
    activity_log_json:  Mapped[Optional[list]]     = mapped_column(JSONB)
    meal_template_json: Mapped[Optional[list]]     = mapped_column(JSONB)
    meal_activities_json: Mapped[Optional[list]]   = mapped_column(JSONB)


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
    camp_id:     Mapped[Optional[str]] = mapped_column(String(36))
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
