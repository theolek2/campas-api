"""
routers/camps.py — CRUD obozów, zastępów i uprawnień.
"""
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user, require_camp_access, require_camp_owner
from models.shared import Camp, Patrol, CampAccess, CampInvitation, User
from schemas.camps import CampOut, CampCreate, PatrolOut
from services.auth import generate_token

router = APIRouter(prefix="/api/camps", tags=["camps"])


# ── Obozy ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[CampOut])
async def list_camps(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Camp)
        .join(CampAccess, (CampAccess.camp_id == Camp.id) & (CampAccess.user_id == user_id))
        .order_by(Camp.date_start.desc())
    )
    return result.scalars().all()


@router.post("", response_model=CampOut, status_code=201)
async def create_camp(
    data: CampCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    camp = Camp(
        unit_name=data.unit_name,
        date_start=data.date_start,
        date_end=data.date_end,
        terrain_id=data.terrain_id,
        created_at=datetime.datetime.now(datetime.UTC),
    )
    db.add(camp)
    await db.flush()
    db.add(CampAccess(camp_id=camp.id, user_id=user_id, permissions="owner"))
    await db.commit()
    await db.refresh(camp)
    return camp


@router.get("/{camp_id}", response_model=CampOut)
async def get_camp(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    camp = await db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Obóz nie istnieje")
    return camp


@router.patch("/{camp_id}", response_model=CampOut)
async def update_camp(
    camp_id: str,
    data: dict,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    camp = await db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Obóz nie istnieje")
    for field in ("unit_name", "date_start", "date_end", "terrain_id"):
        if field in data:
            setattr(camp, field, data[field])
    await db.commit()
    await db.refresh(camp)
    return camp


# ── Zastępy ───────────────────────────────────────────────────────────────────

@router.get("/{camp_id}/patrols", response_model=list[PatrolOut])
async def list_patrols(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patrol).where(Patrol.camp_id == camp_id))
    return result.scalars().all()


@router.post("/{camp_id}/patrols", response_model=PatrolOut, status_code=201)
async def create_patrol(
    camp_id: str,
    data: dict,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    patrol = Patrol(
        camp_id=camp_id,
        patrol_name=data.get("patrol_name"),
        people_number=data.get("people_number"),
    )
    db.add(patrol)
    await db.commit()
    await db.refresh(patrol)
    return patrol


# ── Zaproszenia ───────────────────────────────────────────────────────────────

@router.post("/{camp_id}/invite", status_code=201)
async def create_invite(
    camp_id: str,
    data: dict,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    """Utwórz link zaproszenia (multi) lub emailowe zaproszenie (single)."""
    invite_type = data.get("type", "multi")  # "multi" | "single"
    email       = data.get("email")

    if invite_type == "single" and not email:
        raise HTTPException(status_code=400, detail="Zaproszenie jednorazowe wymaga podania emaila")

    token = generate_token()
    inv   = CampInvitation(
        camp_id=camp_id,
        email=email,
        invited_by=user_id,
        token=token,
        type=invite_type,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7),
    )
    db.add(inv)
    await db.commit()
    return {"token": token, "type": invite_type}


# ── Dostęp uczestników ────────────────────────────────────────────────────────

@router.get("/{camp_id}/members")
async def list_members(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User, CampAccess.permissions)
        .join(CampAccess, CampAccess.user_id == User.id)
        .where(CampAccess.camp_id == camp_id)
    )
    return [
        {"id": u.id, "email": u.email, "display_name": u.display_name, "permissions": p}
        for u, p in result.all()
    ]
