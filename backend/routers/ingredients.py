"""
routers/ingredients.py — składniki jadłospisu (API_ingredients).
Prefix: /api/ingredients
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.ingredients import AppIngredient
from schemas.ingredients import IngredientCreate, IngredientSeed

router = APIRouter(prefix="/api/ingredients", tags=["ingredients"])


@router.get("")
async def list_ingredients(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AppIngredient).order_by(AppIngredient.name))
    return [i.name for i in result.scalars().all()]


@router.post("", status_code=201)
async def add_ingredient(
    data: IngredientCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = sqlite_insert(AppIngredient).values(name=data.name)
    stmt = stmt.on_conflict_do_nothing(index_elements=["name"])
    await db.execute(stmt)
    await db.commit()
    return {"ok": True, "name": data.name}


@router.post("/seed", status_code=201)
async def seed_ingredients(
    data: IngredientSeed,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = 0
    for name in data.names:
        stmt = sqlite_insert(AppIngredient).values(name=name)
        stmt = stmt.on_conflict_do_nothing(index_elements=["name"])
        await db.execute(stmt)
        count += 1
    await db.commit()
    return {"seeded": count}
