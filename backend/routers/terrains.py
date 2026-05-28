"""
routers/terrains.py — tereny obozowe (terrains).
Prefix: /api/terrains
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from database import get_db
from dependencies import get_current_user
from models.shared import Terrain
from schemas.terrains import TerrainCreate

router = APIRouter(prefix="/api/terrains", tags=["terrains"])


def _terrain_dict(t: Terrain) -> dict:
    return {
        "id":            t.id,
        "name":          t.name,
        "lat":           t.lat,
        "lng":           t.lng,
        "address":       t.address,
        "owner_name":    t.owner_name,
        "owner_contact": t.owner_contact,
        "owner_notes":   t.owner_notes,
        "is_public":     t.is_public,
    }


@router.get("")
async def list_terrains(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Terrain).order_by(Terrain.name))
    return [_terrain_dict(t) for t in result.scalars().all()]


@router.post("")
async def create_terrain(
    body: TerrainCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Tworzy nowy teren."""
    new_id = str(uuid.uuid4())
    try:
        await db.execute(
            text("""
                INSERT INTO terrains (id, name, lat, lng, address, owner_name, owner_contact, owner_notes, is_public)
                VALUES (:id, :name, :lat, :lng, :address, :owner_name, :owner_contact, :owner_notes, :is_public)
                ON CONFLICT(id) DO NOTHING
            """),
            {
                "id": new_id, "name": body.name,
                "lat": body.lat, "lng": body.lng,
                "address": body.address,
                "owner_name": body.owner_name,
                "owner_contact": body.owner_contact,
                "owner_notes": body.owner_notes,
                "is_public": body.is_public,
            },
        )
        await db.commit()
    except Exception:
        # Fallback: próbuj bez ON CONFLICT
        await db.rollback()
        try:
            t = Terrain(id=new_id, name=body.name)
            db.add(t)
            await db.commit()
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
    return {"id": new_id, "name": body.name}


@router.get("/{terrain_id}")
async def get_terrain(
    terrain_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    terrain = await db.get(Terrain, terrain_id)
    if not terrain:
        raise HTTPException(status_code=404, detail="Teren nie istnieje")
    return _terrain_dict(terrain)
