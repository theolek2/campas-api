"""
routers/terrains.py — tereny obozowe (terrains).
Prefix: /api/terrains
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from database import get_db
from dependencies import get_current_user
from models.shared import Terrain

router = APIRouter(prefix="/api/terrains", tags=["terrains"])


def _terrain_dict(t: Terrain) -> dict:
    return {
        "id":   t.id,
        "name": t.name,
    }


class TerrainCreate(BaseModel):
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    owner_notes: Optional[str] = None
    created_by: Optional[str] = None
    is_public: Optional[bool] = True


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
    """Tworzy nowy teren (wstawia do tabeli terrains)."""
    new_id = str(uuid.uuid4())
    # Używamy raw SQL żeby ominąć ograniczenia modelu (tabela może mieć więcej kolumn)
    try:
        await db.execute(
            text("""
                INSERT INTO terrains (id, name)
                VALUES (:id, :name)
                ON CONFLICT(id) DO NOTHING
            """),
            {"id": new_id, "name": body.name},
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
