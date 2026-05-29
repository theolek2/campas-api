"""
routers/external_users.py — przyboczni (API_external_users).
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
from services.auth import hash_password as _hash_bcrypt, verify_password as _verify_bcrypt, validate_password, generate_password
from schemas.external_users import InviteMember, CreateGuest, GuestLogin, ChangePassword, UpdateMember

router = APIRouter(prefix="/api/camps/{camp_id}/team", tags=["team"])

_now = lambda: datetime.now(timezone.utc)

SESSION_EXPIRE_DAYS = 30
# Stara sól SHA256 — tylko do obsługi istniejących haseł
_LEGACY_SALT = "campos-guest-hash-2026"


def _verify_guest_password(password: str, stored_hash: str, email: str) -> bool:
    """Weryfikuje hasło gościa — obsługuje bcrypt (nowe) i SHA256 (stare)."""
    if not stored_hash:
        return False
    if stored_hash.startswith("$"):
        return _verify_bcrypt(password, stored_hash)
    # Legacy SHA256
    expected = hashlib.sha256(f"{password}:{_LEGACY_SALT}:{email}".encode()).hexdigest()
    return expected == stored_hash


def _set_session_expiry(user: AppExternalUser) -> None:
    """Ustawia wygaśnięcie sesji — bezpieczne jeśli kolumna jeszcze nie istnieje."""
    try:
        user.session_token_expires = _now() + timedelta(days=SESSION_EXPIRE_DAYS)
    except Exception:
        pass


def _check_session_expired(user: AppExternalUser) -> bool:
    """Sprawdza czy sesja wygasła. False jeśli kolumna nie istnieje."""
    try:
        expires = user.session_token_expires
    except Exception:
        return False
    return bool(expires and _now() > expires)


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
    data: InviteMember,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    email = data.email
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
        existing.display_name = data.name or existing.display_name
        existing.phone = data.phone or existing.phone
        existing.role = data.role or "przyboczny"
    else:
        db.add(AppExternalUser(
            email=email,
            display_name=data.name,
            phone=data.phone,
            role=data.role or "przyboczny",
            invited_by=user_id,
            magic_token=token,
            token_expires=expires,
            camp_id=camp_id,
            active=False,
        ))
    await db.commit()

    from config import settings
    url = f"{settings.FRONTEND_URL}/magic?token={token}"
    return {"success": True, "url": url}


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
    _set_session_expiry(user)
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
            AppExternalUser.camp_id == camp_id,
            AppExternalUser.active == True,  # noqa
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Sesja wygasła")
    if _check_session_expired(user):
        user.session_token = None
        await db.commit()
        raise HTTPException(status_code=401, detail="Sesja wygasła")
    return {"user": _user_dict(user)}


# ── Utwórz gościa z hasłem ───────────────────────────────────────────────────

@router.post("/create-guest", status_code=201)
async def create_guest(
    camp_id: str,
    data: CreateGuest,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    email = data.email
    name = data.name or email.split("@")[0]
    if not email:
        raise HTTPException(status_code=400, detail="Email jest wymagany")

    password = generate_password()
    pw_hash = _hash_bcrypt(password)
    session_token = secrets.token_urlsafe(48)

    result = await db.execute(
        select(AppExternalUser).where(AppExternalUser.email == email)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.display_name = name
        existing.password_hash = pw_hash
        existing.session_token = session_token
        _set_session_expiry(existing)
        existing.active = True
        existing.camp_id = camp_id
    else:
        new_user = AppExternalUser(
            email=email,
            display_name=name,
            password_hash=pw_hash,
            session_token=session_token,
            active=True,
            camp_id=camp_id,
            invited_by=user_id,
            role="przyboczny",
        )
        db.add(new_user)
        try:
            new_user.session_token_expires = _now() + timedelta(days=SESSION_EXPIRE_DAYS)
        except Exception:
            pass
    await db.commit()
    return {"success": True, "email": email, "password": password}


# ── Logowanie hasłem ──────────────────────────────────────────────────────────

@router.post("/guest-login")
async def guest_login(
    camp_id: str,
    data: GuestLogin,
    db: AsyncSession = Depends(get_db),
):
    email = data.email
    password = data.password

    result = await db.execute(
        select(AppExternalUser).where(
            AppExternalUser.email == email,
            AppExternalUser.active == True,  # noqa
        )
    )
    user = result.scalar_one_or_none()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")

    if not _verify_guest_password(password, user.password_hash, email):
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")

    # Jeśli to stare SHA256 — upgrade do bcrypt
    if not user.password_hash.startswith("$"):
        user.password_hash = _hash_bcrypt(password)

    session_token = secrets.token_urlsafe(48)
    user.session_token = session_token
    _set_session_expiry(user)
    user.last_login = _now()
    await db.commit()

    return {"session_token": session_token, "user": _user_dict(user)}


# ── Zmiana hasła ──────────────────────────────────────────────────────────────

@router.post("/change-password")
async def change_password(
    camp_id: str,
    data: ChangePassword,
    db: AsyncSession = Depends(get_db),
):
    session_token = data.sessionToken
    old_password = data.oldPassword
    new_password = data.newPassword
    err = validate_password(new_password)
    if err:
        raise HTTPException(status_code=400, detail=err)

    result = await db.execute(
        select(AppExternalUser).where(AppExternalUser.session_token == session_token)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Nieprawidłowa sesja")

    if user.password_hash and not _verify_guest_password(old_password, user.password_hash, user.email):
        raise HTTPException(status_code=400, detail="Obecne hasło jest nieprawidłowe")

    user.password_hash = _hash_bcrypt(new_password)
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

    new_password = generate_password()
    user.password_hash = _hash_bcrypt(new_password)
    user.session_token = None
    await db.commit()
    return {"password": new_password}


# ── Toggle active / robert_enabled ───────────────────────────────────────────

@router.patch("/{member_id}")
async def update_member(
    camp_id: str,
    member_id: str,
    data: UpdateMember,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    member = await db.get(AppExternalUser, member_id)
    if not member or member.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    for field in ("active", "robert_enabled", "display_name", "phone", "role"):
        val = getattr(data, field, None)
        if val is not None:
            setattr(member, field, val)
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
