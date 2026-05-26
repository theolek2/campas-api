"""
routers/external_users.py — przyboczni (app_external_users).
Prefix: /api/camps/{camp_id}/team
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user, require_camp_access, require_camp_owner
from models.external import AppExternalUser, AppRole

router = APIRouter(prefix="/api/camps/{camp_id}/team", tags=["team"])

_now = lambda: datetime.now(timezone.utc)

GUEST_HASH_SALT = "campos-guest-hash-2026"


def _hash_password(password: str, email: str) -> str:
    """SHA256 zgodny z api/create-guest.js."""
    return hashlib.sha256(f"{password}:{GUEST_HASH_SALT}:{email}".encode()).hexdigest()


def _user_dict(u: AppExternalUser) -> dict:
    return {
        "id":             u.id,
        "email":          u.email,
        "display_name":   u.display_name,
        "phone":          u.phone,
        "role":           u.role,
        "active":         u.active,
        "robert_enabled": u.robert_enabled,
        "camp_id":        u.camp_id,
        "last_login":     u.last_login.isoformat() if u.last_login else None,
        "created_at":     u.created_at.isoformat() if u.created_at else None,
    }


# ── Lista przybocznych ────────────────────────────────────────────────────────

@router.get("")
async def list_team(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppExternalUser).where(AppExternalUser.camp_id == camp_id)
    )
    return [_user_dict(u) for u in result.scalars().all()]


# ── Wyślij magic link ─────────────────────────────────────────────────────────

@router.post("/invite", status_code=201)
async def invite_member(
    camp_id: str,
    data: dict,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    email = data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email jest wymagany")

    token = secrets.token_urlsafe(32)
    expires = _now() + timedelta(days=7)

    # Utwórz lub zaktualizuj
    result = await db.execute(
        select(AppExternalUser).where(AppExternalUser.email == email)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.magic_token = token
        existing.token_expires = expires
        existing.camp_id = camp_id
        existing.invited_by = user_id
        existing.display_name = data.get("name", existing.display_name)
        existing.phone = data.get("phone", existing.phone)
        existing.role = data.get("role", existing.role or "przyboczny")
    else:
        db.add(AppExternalUser(
            email=email,
            display_name=data.get("name"),
            phone=data.get("phone"),
            role=data.get("role", "przyboczny"),
            invited_by=user_id,
            magic_token=token,
            token_expires=expires,
            camp_id=camp_id,
            active=False,
        ))
    await db.commit()

    from config import settings
    url = f"{settings.FRONTEND_URL}/magic?token={token}"
    return {"success": True, "token": token, "url": url}


# ── Magic login ───────────────────────────────────────────────────────────────

@router.get("/magic-login")
async def magic_login(
    camp_id: str,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppExternalUser).where(
            AppExternalUser.magic_token == token,
            AppExternalUser.camp_id == camp_id,
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Nieprawidłowy token")
    if user.token_expires and _now() > user.token_expires:
        raise HTTPException(status_code=401, detail="Token wygasł")

    session_token = secrets.token_urlsafe(48)
    user.active = True
    user.session_token = session_token
    user.last_login = _now()
    user.magic_token = None  # jednorazowy
    await db.commit()

    return {
        "session_token": session_token,
        "user": _user_dict(user),
    }


# ── Weryfikacja sesji ─────────────────────────────────────────────────────────

@router.get("/session")
async def verify_session(
    camp_id: str,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppExternalUser).where(
            AppExternalUser.session_token == token,
            AppExternalUser.active == True,  # noqa
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Sesja wygasła")
    return {"user": _user_dict(user)}


# ── Utwórz gościa z hasłem ───────────────────────────────────────────────────

@router.post("/create-guest", status_code=201)
async def create_guest(
    camp_id: str,
    data: dict,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    email = data.get("email", "").strip().lower()
    name = data.get("name", email.split("@")[0])
    if not email:
        raise HTTPException(status_code=400, detail="Email jest wymagany")

    password = secrets.token_urlsafe(8)
    pw_hash = _hash_password(password, email)
    session_token = secrets.token_urlsafe(48)

    result = await db.execute(
        select(AppExternalUser).where(AppExternalUser.email == email)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.display_name = name
        existing.password_hash = pw_hash
        existing.session_token = session_token
        existing.active = True
        existing.camp_id = camp_id
    else:
        db.add(AppExternalUser(
            email=email,
            display_name=name,
            password_hash=pw_hash,
            session_token=session_token,
            active=True,
            camp_id=camp_id,
            invited_by=user_id,
            role="przyboczny",
        ))
    await db.commit()
    return {"success": True, "email": email, "password": password}


# ── Logowanie hasłem ──────────────────────────────────────────────────────────

@router.post("/guest-login")
async def guest_login(
    camp_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    pw_hash = _hash_password(password, email)

    result = await db.execute(
        select(AppExternalUser).where(
            AppExternalUser.email == email,
            AppExternalUser.password_hash == pw_hash,
            AppExternalUser.active == True,  # noqa
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")

    session_token = secrets.token_urlsafe(48)
    user.session_token = session_token
    user.last_login = _now()
    await db.commit()

    return {"session_token": session_token, "user": _user_dict(user)}


# ── Zmiana hasła ──────────────────────────────────────────────────────────────

@router.post("/change-password")
async def change_password(
    camp_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    session_token = data.get("sessionToken", "")
    new_password = data.get("newPassword", "")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Hasło musi mieć min. 6 znaków")

    result = await db.execute(
        select(AppExternalUser).where(AppExternalUser.session_token == session_token)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Nieprawidłowa sesja")

    user.password_hash = _hash_password(new_password, user.email)
    await db.commit()
    return {"success": True}


# ── Reset hasła (przez właściciela) ──────────────────────────────────────────

@router.post("/{member_id}/reset")
async def reset_password(
    camp_id: str,
    member_id: str,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(AppExternalUser, member_id)
    if not user or user.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    new_password = secrets.token_urlsafe(8)
    user.password_hash = _hash_password(new_password, user.email)
    user.session_token = None
    await db.commit()
    return {"password": new_password}


# ── Toggle active / robert_enabled ───────────────────────────────────────────

@router.patch("/{member_id}")
async def update_member(
    camp_id: str,
    member_id: str,
    data: dict,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    member = await db.get(AppExternalUser, member_id)
    if not member or member.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    for field in ("active", "robert_enabled", "display_name", "phone", "role"):
        if field in data:
            setattr(member, field, data[field])
    await db.commit()
    await db.refresh(member)
    return _user_dict(member)


# ── Usuń przybocznego ─────────────────────────────────────────────────────────

@router.delete("/{member_id}", status_code=204)
async def delete_member(
    camp_id: str,
    member_id: str,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    member = await db.get(AppExternalUser, member_id)
    if not member or member.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    await db.delete(member)
    await db.commit()


# ── Role ──────────────────────────────────────────────────────────────────────

@router.get("/roles")
async def list_roles(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AppRole))
    return [{"id": r.id, "name": r.name, "label": r.label,
             "permissions": r.permissions} for r in result.scalars().all()]
