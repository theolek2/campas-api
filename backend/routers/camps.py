"""
routers/camps.py — CRUD obozów, zastępów i uprawnień.
"""
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user, require_camp_access, require_camp_owner
from models.shared import Camp, Patrol, CampAccess, CampInvitation, User, Terrain, Profile
from schemas.camps import CampOut, CampCreate, CampUpdate, PatrolCreate, PatrolOut, InviteCreate
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
    data: CampUpdate,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    camp = await db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Obóz nie istnieje")
    for field in ("unit_name", "date_start", "date_end", "terrain_id"):
        val = getattr(data, field, None)
        if val is not None:
            setattr(camp, field, val)
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
    data: PatrolCreate,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    patrol = Patrol(
        camp_id=camp_id,
        patrol_name=data.patrol_name,
        people_number=data.people_number,
    )
    db.add(patrol)
    await db.commit()
    await db.refresh(patrol)
    return patrol


# ── Zaproszenia ───────────────────────────────────────────────────────────────

@router.post("/{camp_id}/invite", status_code=201)
async def create_invite(
    camp_id: str,
    data: InviteCreate,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    """Utwórz link zaproszenia (multi) lub emailowe zaproszenie (single)."""
    token = generate_token()
    inv   = CampInvitation(
        camp_id=camp_id,
        email=data.email,
        invited_by=user_id,
        token=token,
        type=data.type,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7),
    )
    db.add(inv)
    await db.commit()
    return {"token": token, "type": data.type}


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


# ── Mapa krajowa — wszystkie obozy (bez filtra usera) ──────────────────────

@router.get("/all")
async def list_all_camps(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Zwraca wszystkie obozy z danymi terenu — dla mapy krajowej."""
    result = await db.execute(
        select(Camp)
        .order_by(Camp.date_start.desc())
    )
    camps_data = result.scalars().all()

    # Pobierz tereny osobno (omija błąd VARCHAR/UUID mismatch w JOIN-ie)
    terrain_ids = [c.terrain_id for c in camps_data if c.terrain_id]
    terrains_map = {}
    if terrain_ids:
        tr = await db.execute(select(Terrain).where(Terrain.id.in_(terrain_ids)))
        for t in tr.scalars().all():
            terrains_map[t.id] = t

    camps = []
    for camp in camps_data:
        terrain = terrains_map.get(camp.terrain_id) if camp.terrain_id else None
        camps.append({
            "id":          camp.id,
            "unit_name":   camp.unit_name,
            "date_start":  camp.date_start.isoformat() if camp.date_start else None,
            "date_end":    camp.date_end.isoformat() if camp.date_end else None,
            "terrain_id":  camp.terrain_id,
            "created_at":  camp.created_at.isoformat() if camp.created_at else None,
            "terrain": {
                "id":            terrain.id,
                "name":          terrain.name,
                "lat":           terrain.lat,
                "lng":           terrain.lng,
                "address":       terrain.address,
                "owner_name":    terrain.owner_name,
                "owner_contact": terrain.owner_contact,
                "owner_notes":   terrain.owner_notes,
            } if terrain else None,
        })
    return camps


# ── Profile użytkownika ──────────────────────────────────────────────────────

@router.get("/profiles/me")
async def get_my_profile(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await db.get(Profile, user_id)
    if not profile:
        return {"id": user_id, "display_name": None, "organization": None, "phone": None, "camp_meta": None}
    return {
        "id": profile.id,
        "display_name": profile.display_name,
        "organization": profile.organization,
        "phone": profile.phone,
        "camp_meta": profile.camp_meta,
    }


@router.patch("/profiles/me")
async def update_my_profile(
    data: dict,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await db.get(Profile, user_id)
    allowed = ("display_name", "organization", "phone", "camp_meta")
    if not profile:
        profile = Profile(id=user_id)
        db.add(profile)
        await db.flush()
    for field in allowed:
        if field in data:
            setattr(profile, field, data[field])
    await db.commit()
    return {"ok": True}
