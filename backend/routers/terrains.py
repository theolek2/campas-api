"""
routers/terrains.py — tereny obozowe (terrains).
Prefix: /api/terrains
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.shared import Terrain

router = APIRouter(prefix="/api/terrains", tags=["terrains"])


def _terrain_dict(t: Terrain) -> dict:
    return {
        "id":   t.id,
        "name": t.name,
    }


@router.get("")
async def list_terrains(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Terrain).order_by(Terrain.name))
    return [_terrain_dict(t) for t in result.scalars().all()]


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
