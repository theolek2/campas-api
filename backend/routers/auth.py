"""
routers/auth.py — endpointy autoryzacji.
Logika: services/auth.py + services/email.py
Modele: models/shared.py
"""
import datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.shared import User, CampAccess, CampInvitation, Camp
from models.external import AppExternalUser
from schemas.auth import RegisterIn, LoginIn, ForgotPasswordIn, ResetPasswordIn, AcceptInviteIn, AuthResponse, UserOut
from services.auth import hash_password, verify_password, create_jwt, generate_token, validate_password
from services.email import send_verification_email, send_reset_email
from config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=201)
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)):
    err = validate_password(data.password)
    if err:
        raise HTTPException(status_code=400, detail=err)

    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Użytkownik już istnieje")

    auto_verify = not bool(settings.SMTP_HOST)

    # Walidacja zaproszenia — jeśli token zgadza się z emailem, auto-weryfikacja
    if data.invite_token:
        now   = datetime.datetime.now(datetime.UTC)
        inv_r = await db.execute(
            select(CampInvitation).where(
                CampInvitation.token == data.invite_token,
                CampInvitation.type == "single",
                func.lower(CampInvitation.email) == data.email.lower(),
                CampInvitation.expires_at > now,
            ).limit(1)
        )
        inv = inv_r.scalar_one_or_none()
        if inv:
            auto_verify = True
            inv.used_at = now
            db.add(inv)

    verif_token = generate_token()
    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        role="user",
        email_verified=auto_verify,
        verification_token=verif_token,
        verification_token_exp=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=24),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Nadaj dostęp do obozu z zaproszenia
    if auto_verify and data.invite_token:
        inv2_r = await db.execute(select(CampInvitation).where(CampInvitation.token == data.invite_token).limit(1))
        inv2 = inv2_r.scalar_one_or_none()
        if inv2:
            acc_r = await db.execute(select(CampAccess).where(CampAccess.camp_id == inv2.camp_id, CampAccess.user_id == user.id))
            if not acc_r.scalar_one_or_none():
                db.add(CampAccess(camp_id=inv2.camp_id, user_id=user.id, permissions="przyboczny"))
            await db.commit()

    if auto_verify:
        return AuthResponse(token=create_jwt(user.id, user.email, user.role), user=UserOut.model_validate(user))

    sent = await send_verification_email(user.email, verif_token)
    if not sent:
        raise HTTPException(status_code=500, detail="Nie udało się wysłać emaila. Spróbuj ponownie później.")

    return {"message": "Konto utworzone. Sprawdź email, aby zweryfikować."}


@router.post("/resend-verification")
async def resend_verification(data: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "Jeśli konto istnieje i nie jest zweryfikowane, wysłano email."}
    if user.email_verified:
        return {"message": "Konto jest już zweryfikowane."}

    verif_token = generate_token()
    user.verification_token = verif_token
    user.verification_token_exp = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=24)
    await db.commit()

    sent = await send_verification_email(user.email, verif_token)
    if not sent:
        raise HTTPException(status_code=500, detail="Nie udało się wysłać emaila. Spróbuj ponownie później.")
    return {"message": "Email weryfikacyjny wysłany ponownie."}


@router.get("/verify-email")
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    now    = datetime.datetime.now(datetime.UTC)
    result = await db.execute(
        select(User).where(User.verification_token == token, User.verification_token_exp > now)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Nieprawidłowy lub wygasły token")
    user.email_verified         = True
    user.verification_token     = None
    user.verification_token_exp = None
    await db.commit()
    return AuthResponse(token=create_jwt(user.id, user.email, user.role), user=UserOut.model_validate(user))


@router.post("/login")
async def login(data: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Konto niezweryfikowane. Sprawdź email.")
    return AuthResponse(token=create_jwt(user.id, user.email, user.role), user=UserOut.model_validate(user))


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user   = result.scalar_one_or_none()
    if user:
        reset_token          = generate_token()
        user.reset_token     = reset_token
        user.reset_token_exp = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)
        await db.commit()
        await send_reset_email(user.email, reset_token)
    return {"message": "Jeśli konto istnieje, wysłano link resetujący."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordIn, db: AsyncSession = Depends(get_db)):
    err = validate_password(data.password)
    if err:
        raise HTTPException(status_code=400, detail=err)
    now    = datetime.datetime.now(datetime.UTC)
    result = await db.execute(
        select(User).where(User.reset_token == data.token, User.reset_token_exp > now)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Nieprawidłowy lub wygasły token")
    user.password_hash = hash_password(data.password)
    user.reset_token     = None
    user.reset_token_exp = None
    await db.commit()
    return {"message": "Hasło zmienione."}


@router.get("/invite-info")
async def invite_info(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    now    = datetime.datetime.now(datetime.UTC)
    result = await db.execute(
        select(CampInvitation).where(CampInvitation.token == token, CampInvitation.expires_at > now).limit(1)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Zaproszenie nie istnieje lub wygasło")
    if inv.type == "single" and inv.used_at:
        raise HTTPException(status_code=410, detail="Zaproszenie zostało już wykorzystane")
    camp      = await db.get(Camp, inv.camp_id)
    camp_name = f"{camp.unit_name or 'Obóz'} {camp.date_start.year}" if camp else "Obóz"
    return {"camp_name": camp_name, "type": inv.type, "email": inv.email}


@router.post("/accept-invite", status_code=201)
async def accept_invite(
    data: AcceptInviteIn,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now    = datetime.datetime.now(datetime.UTC)
    result = await db.execute(
        select(CampInvitation).where(CampInvitation.token == data.token, CampInvitation.expires_at > now).limit(1)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Zaproszenie nie istnieje lub wygasło")
    if inv.type == "single":
        if inv.used_at:
            acc_chk = await db.execute(select(CampAccess).where(CampAccess.camp_id == inv.camp_id, CampAccess.user_id == user_id))
            if acc_chk.scalar_one_or_none():
                return {"camp_id": inv.camp_id, "message": "Już dołączono do obozu"}
            raise HTTPException(status_code=410, detail="Zaproszenie zostało już wykorzystane")
        user_r = await db.execute(select(User).where(User.id == user_id))
        user   = user_r.scalar_one_or_none()
        if not user or user.email.lower() != (inv.email or "").lower():
            raise HTTPException(status_code=403, detail="Email nie zgadza się z zaproszeniem")
        inv.used_at = now
    acc_r = await db.execute(select(CampAccess).where(CampAccess.camp_id == inv.camp_id, CampAccess.user_id == user_id))
    if not acc_r.scalar_one_or_none():
        db.add(CampAccess(camp_id=inv.camp_id, user_id=user_id, permissions="przyboczny"))
    await db.commit()
    return {"camp_id": inv.camp_id, "message": "Dołączono do obozu"}


@router.get("/magic-login")
async def auth_magic_login(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Logowanie przybocznego przez magic link. Zwraca sesję i camp_id."""
    now = datetime.datetime.now(datetime.UTC)
    result = await db.execute(
        select(AppExternalUser).where(
            AppExternalUser.magic_token == token,
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Nieprawidłowy lub wygasły link")
    if user.token_expires and now > user.token_expires:
        raise HTTPException(status_code=401, detail="Link wygasł")

    session_token = secrets.token_urlsafe(48)
    user.active = True
    user.session_token = session_token
    user.session_token_expires = now + datetime.timedelta(days=30)
    user.last_login = now
    user.magic_token = None
    await db.commit()

    return {
        "session_token": session_token,
        "camp_id": user.camp_id,
        "user": {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "phone": user.phone,
            "role": user.role,
            "active": user.active,
            "robert_enabled": user.robert_enabled,
            "camp_id": user.camp_id,
        },
    }
