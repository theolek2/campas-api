"""
routers/planning.py — harmonogram / plan obozu (tabele API_plan_items).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import require_camp_access
from models.app import AppPlanItem
from schemas.planning import PlanItemOut, PlanItemCreate, PlanItemUpdate

router = APIRouter(prefix="/api/camps/{camp_id}/planning", tags=["planning"])


@router.get("", response_model=list[PlanItemOut])
async def list_plan_items(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppPlanItem)
        .where(AppPlanItem.camp_id == camp_id)
        .order_by(AppPlanItem.day_date, AppPlanItem.time_start)
    )
    return result.scalars().all()


@router.post("", response_model=PlanItemOut, status_code=201)
async def create_plan_item(
    camp_id: str,
    data: PlanItemCreate,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    item = AppPlanItem(camp_id=camp_id, created_by=user_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=PlanItemOut)
async def update_plan_item(
    camp_id: str,
    item_id: str,
    data: PlanItemUpdate,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(AppPlanItem, item_id)
    if not item or item.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Punkt planu nie istnieje")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
async def delete_plan_item(
    camp_id: str,
    item_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(AppPlanItem, item_id)
    if not item or item.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Punkt planu nie istnieje")
    await db.delete(item)
    await db.commit()
