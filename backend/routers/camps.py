"""
routers/camps.py — CRUD obozów, zastępów i uprawnień.
"""
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
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


# ── Mapa krajowa — wszystkie obozy (bez filtra usera) ──────────────────────
# WAŻNE: musi być przed /{camp_id} żeby FastAPI nie przechwycił /all jako camp_id

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
# WAŻNE: musi być przed /{camp_id}

@router.get("/profiles/me")
async def get_my_profile(
    user_id: str = Depends(get_current_user),
    camp_id: str = Query(None, description="Opcjonalne ID obozu — zwróci też dane z tabeli camps"),
    db: AsyncSession = Depends(get_db),
):
    profile = await db.get(Profile, user_id)
    meta = profile.camp_meta if profile else None
    camp_data = {}
    if camp_id:
        camp = await db.get(Camp, camp_id)
        if camp:
            camp_data = {
                "camps_unit_name": camp.unit_name,
                "camps_date_start": camp.date_start.isoformat() if camp.date_start else None,
                "camps_date_end":   camp.date_end.isoformat() if camp.date_end else None,
            }
            # Uzupełnij meta z camps jeśli puste
            if meta is None:
                meta = {}
            if not meta.get("jednostka") and camp.unit_name:
                meta["jednostka"] = camp.unit_name
            if not meta.get("date_start") and camp.date_start:
                meta["date_start"] = camp.date_start.isoformat()
            if not meta.get("date_end") and camp.date_end:
                meta["date_end"] = camp.date_end.isoformat()
    return {
        "id": profile.id if profile else user_id,
        "display_name": profile.display_name if profile else None,
        "organization": profile.organization if profile else None,
        "phone": profile.phone if profile else None,
        "camp_meta": meta,
        **camp_data,
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

    # Sync do tabeli camps jeśli podano camp_id
    camp_id = data.get("camp_id")
    if camp_id and isinstance(data.get("camp_meta"), dict):
        meta = data["camp_meta"]
        camp = await db.get(Camp, camp_id)
        if camp:
            changed = False
            if meta.get("jednostka") is not None and meta["jednostka"] != camp.unit_name:
                camp.unit_name = meta["jednostka"]
                changed = True
            for meta_key, camp_attr in [("date_start", "date_start"), ("date_end", "date_end")]:
                if meta.get(meta_key):
                    try:
                        d = datetime.date.fromisoformat(meta[meta_key])
                        if getattr(camp, camp_attr) != d:
                            setattr(camp, camp_attr, d)
                            changed = True
                    except (ValueError, TypeError):
                        pass
            if changed:
                db.add(camp)

    await db.commit()
    return {"ok": True}


# ── Obóz (pojedynczy) ─────────────────────────────────────────────────────────

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


@router.delete("/{camp_id}/leave", status_code=204)
async def leave_camp(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    """Usuń swój dostęp do obozu (opuść obóz). Owner nie może opuścić — musi najpierw przekazać ownership."""
    access = await db.execute(
        select(CampAccess).where(CampAccess.camp_id == camp_id, CampAccess.user_id == user_id)
    )
    entry = access.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Brak dostępu do obozu")
    if entry.permissions == "owner":
        raise HTTPException(status_code=400, detail="Właściciel nie może opuścić obozu. Najpierw przekaż obóz innemu użytkownikowi lub usuń obóz.")
    await db.delete(entry)
    await db.commit()


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
