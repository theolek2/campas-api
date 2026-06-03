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


# ── Helpers: mapowanie meta ↔ kolumny camps ─────────────────────────────────

_META_TO_CAMP = {
    "jednostka": "unit_name",
    "kierownik": "kierownik",
    "miejsce": "miejsce",
    "termin": "termin",
    "date_start": None,  # handled specially
    "date_end": None,
    "tel_kierownik": "tel_kierownik",
    "email": "email",
    "powiat": "powiat",
    "gmina": "gmina",
    "wojewodztwo": "wojewodztwo",
    "hufiec": "hufiec",
    "typ_obozu": "typ_obozu",
    "nadlesnictwo": "nadlesnictwo",
    "lesnictwo": "lesnictwo",
    "oddzial_lesny": "oddzial_lesny",
    "bezp_adres": "bezp_adres",
    "bezp_budynek": "bezp_budynek",
    "bezp_miejscowosc": "bezp_miejscowosc",
    "lekarz": "lekarz",
    "szpital": "szpital",
    "tel_szpital": "tel_szpital",
    "przychodnia": "przychodnia",
    "tel_przychodnia": "tel_przychodnia",
    "psp": "psp",
    "psp_tel": "psp_tel",
    "policja": "policja",
    "policja_tel": "policja_tel",
    "komendant_tel": "komendant_tel",
    "tel_zastepca": "tel_zastepca",
    "nr_zgloszenia": "nr_zgloszenia",
    "data_zgloszenia": "data_zgloszenia",
    "uwagi": "uwagi",
    "schronienie": "schronienie",
    "kontakt1": "kontakt1",
    "kontakt2": "kontakt2",
    "tel_kontakt1": "tel_kontakt1",
    "tel_kontakt2": "tel_kontakt2",
    "uczestnicy": "uczestnicy",
    "liczba_kadry": "liczba_kadry",
    "wiek": "wiek",
    "coords": "coords",
    "wychowawcy": "wychowawcy",
    "nr_dzialki": "nr_dzialki",
}

_JSON_STATE_FIELDS = [
    "days_json", "activities_json", "template_json",
    "activity_log_json", "meal_template_json", "meal_activities_json",
]


def _camp_to_dict(camp: Camp) -> dict:
    """Zwraca słownik z wszystkich pól obozu."""
    d = {
        "id": camp.id,
        "unit_name": camp.unit_name,
        "date_start": camp.date_start.isoformat() if camp.date_start else None,
        "date_end": camp.date_end.isoformat() if camp.date_end else None,
        "terrain_id": camp.terrain_id,
        "created_at": camp.created_at.isoformat() if camp.created_at else None,
    }
    # Dane obozu
    for _meta, _col in _META_TO_CAMP.items():
        val = getattr(camp, _col or _meta, None)
        if _col in ("date_start", "date_end"):
            val = val.isoformat() if val else None
        d[_col or _meta] = val

    # JSONB — stan aplikacji
    for f in _JSON_STATE_FIELDS:
        d[f] = getattr(camp, f, None)
    return d


# ── Obóz (pojedynczy) ─────────────────────────────────────────────────────────

@router.get("/{camp_id}")
async def get_camp_full(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    camp = await db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Obóz nie istnieje")
    return _camp_to_dict(camp)


@router.patch("/{camp_id}")
async def update_camp_full(
    camp_id: str,
    data: dict,
    user_id: str = Depends(require_camp_owner),
    db: AsyncSession = Depends(get_db),
):
    camp = await db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Obóz nie istnieje")

    # Podstawowe pola
    for field in ("unit_name", "terrain_id"):
        if field in data:
            setattr(camp, field, data[field])

    # Daty
    for date_field in ("date_start", "date_end"):
        if date_field in data and data[date_field]:
            try:
                setattr(camp, date_field, datetime.date.fromisoformat(data[date_field]))
            except (ValueError, TypeError):
                pass

    # Dane obozu z meta
    for meta_key, col_name in _META_TO_CAMP.items():
        if meta_key in data:
            col = col_name or meta_key
            if col not in ("date_start", "date_end", "unit_name"):
                setattr(camp, col, data[meta_key])

    # JSONB — stan aplikacji
    for f in _JSON_STATE_FIELDS:
        if f in data:
            setattr(camp, f, data[f])

    await db.commit()
    await db.refresh(camp)
    return _camp_to_dict(camp)


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
