"""
routers/join.py — Kody dołączenia do obozu (system Kahoot-style).
"""
import random
import secrets
import string
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user, require_camp_owner
from models.app import CampJoinCode
from models.shared import Camp, CampAccess, User, Profile
from services.auth import hash_password, create_jwt, generate_password

router = APIRouter(tags=["join"])


def _generate_code() -> str:
    return secrets.token_urlsafe(6)  # 8 znaków, ~2.8 biliona kombinacji


# ── Generuj kod dołączenia (tylko owner obozu) ────────────────────────────────
@router.post("/api/camps/{camp_id}/join-code")
async def generate_join_code(
    camp_id: str,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    # Unieważnij poprzedni aktywny kod dla tego obozu (opcjonalnie możemy zostawić)
    existing = await db.execute(
        select(CampJoinCode).where(
            CampJoinCode.camp_id == camp_id,
            CampJoinCode.expires_at > datetime.now(timezone.utc),
        ).order_by(CampJoinCode.created_at.desc()).limit(1)
    )
    old_code = existing.scalar_one_or_none()
    if old_code:
        return {
            "code": old_code.code,
            "expires_at": old_code.expires_at.isoformat(),
            "uses": old_code.uses,
            "max_uses": old_code.max_uses,
        }

    # Generuj unikalny kod — obsłuż race condition przez IntegrityError retry
    join_code = None
    for _ in range(10):
        code = _generate_code()
        try:
            join_code = CampJoinCode(
                camp_id=camp_id,
                code=code,
                created_by=user_id,
                role="przyboczny",
                max_uses=None,
                uses=0,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            )
            db.add(join_code)
            await db.commit()
            await db.refresh(join_code)
            break
        except IntegrityError:
            await db.rollback()
            join_code = None
    if not join_code:
        raise HTTPException(status_code=500, detail="Nie udało się wygenerować unikalnego kodu")

    return {
        "code": join_code.code,
        "expires_at": join_code.expires_at.isoformat(),
        "uses": join_code.uses,
        "max_uses": join_code.max_uses,
    }


@router.post("/api/camps/{camp_id}/join-code/refresh")
async def refresh_join_code(
    camp_id: str,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    """Wygeneruj nowy kod (unieważnia poprzedni przez zmianę expires_at)."""
    existing = await db.execute(
        select(CampJoinCode).where(CampJoinCode.camp_id == camp_id)
    )
    for old in existing.scalars().all():
        old.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    await db.commit()
    return await generate_join_code(camp_id, user_id, db)


# ── Sprawdź kod (publiczny endpoint) ─────────────────────────────────────────
@router.get("/api/join/{code}")
async def get_join_info(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    code_upper = code.upper()
    result = await db.execute(
        select(CampJoinCode).where(CampJoinCode.code == code_upper)
    )
    join_code = result.scalar_one_or_none()
    if not join_code:
        raise HTTPException(status_code=404, detail="Nie znaleziono kodu. Sprawdź czy wpisałeś poprawnie.")
    if join_code.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Kod wygasł. Poproś komendanta o nowy.")
    if join_code.max_uses and join_code.uses >= join_code.max_uses:
        raise HTTPException(status_code=410, detail="Kod został już wykorzystany.")

    camp = await db.get(Camp, join_code.camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Obóz nie istnieje.")

    return {
        "code": join_code.code,
        "camp_id": join_code.camp_id,
        "camp_name": camp.unit_name,
        "date_start": camp.date_start.isoformat() if camp.date_start else None,
        "date_end": camp.date_end.isoformat() if camp.date_end else None,
        "role": join_code.role,
        "expires_at": join_code.expires_at.isoformat(),
        "valid": True,
    }


# ── Użyj kodu (publiczny — tworzy konto lub dodaje dostęp) ────────────────
from pydantic import BaseModel

class JoinRequest(BaseModel):
    display_name: str
    email: str


@router.post("/api/join/{code}")
async def use_join_code(
    code: str,
    body: JoinRequest,
    db: AsyncSession = Depends(get_db),
):
    code_upper = code.upper()
    result = await db.execute(
        select(CampJoinCode).where(CampJoinCode.code == code_upper)
    )
    join_code = result.scalar_one_or_none()
    if not join_code:
        raise HTTPException(status_code=404, detail="Nieprawidłowy kod.")
    if join_code.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Kod wygasł.")
    if join_code.max_uses and join_code.uses >= join_code.max_uses:
        raise HTTPException(status_code=410, detail="Kod już wykorzystany.")

    email_lower = body.email.strip().lower()
    if "@" not in email_lower:
        raise HTTPException(status_code=400, detail="Podaj poprawny adres email.")

    # Znajdź lub utwórz użytkownika
    user = await db.execute(select(User).where(User.email == email_lower))
    user = user.scalar_one_or_none()
    is_new = False

    if not user:
        pwd = generate_password()
        user = User(
            email=email_lower,
            password_hash=hash_password(pwd),
            role="user",
            email_verified=True,  # auto-verified for join flow
        )
        db.add(user)
        await db.flush()

        profile = Profile(
            id=user.id,
            display_name=body.display_name.strip() or email_lower.split("@")[0],
            created_at=datetime.now(timezone.utc),
        )
        db.add(profile)
        is_new = True

    # Sprawdź czy już ma dostęp do obozu
    existing_access = await db.execute(
        select(CampAccess).where(
            CampAccess.camp_id == join_code.camp_id,
            CampAccess.user_id == user.id,
        )
    )
    if existing_access.scalar_one_or_none():
        token = create_jwt(user.id, user.email, user.role)
        return {
            "success": True,
            "token": token,
            "user": {"id": user.id, "email": user.email, "display_name": body.display_name.strip()},
            "camp_id": join_code.camp_id,
            "already_member": True,
        }

    # Dodaj dostęp
    access = CampAccess(
        user_id=user.id,
        camp_id=join_code.camp_id,
        permissions=join_code.role,
    )
    db.add(access)
    join_code.uses += 1
    await db.commit()

    token = create_jwt(user.id, user.email, user.role)
    return {
        "success": True,
        "token": token,
        "user": {"id": user.id, "email": user.email, "display_name": body.display_name.strip()},
        "camp_id": join_code.camp_id,
        "already_member": False,
    }
