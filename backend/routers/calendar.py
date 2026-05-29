"""
routers/calendar.py — kalendarz obozowy (API_calendar_events).
Prefix: /api/camps/{camp_id}/calendar
"""
from datetime import datetime, timezone, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import require_camp_access
from models.calendar import AppCalendarEvent
from schemas.calendar import CalendarEventCreate, CalendarEventUpdate

router = APIRouter(prefix="/api/camps/{camp_id}/calendar", tags=["calendar"])

_now = lambda: datetime.now(timezone.utc)


def _event_dict(e: AppCalendarEvent) -> dict:
    return {
        "id":          e.id,
        "camp_id":     e.camp_id,
        "title":       e.title,
        "description": e.description,
        "date_start":  e.date_start.isoformat() if e.date_start else None,
        "date_end":    e.date_end.isoformat() if e.date_end else None,
        "time_start":  e.time_start,
        "time_end":    e.time_end,
        "color":       e.color,
        "created_by":  e.created_by,
        "task_id":     e.task_id,
        "created_at":  e.created_at.isoformat() if e.created_at else None,
    }


@router.get("")
async def list_events(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppCalendarEvent)
        .where(AppCalendarEvent.camp_id == camp_id)
        .order_by(AppCalendarEvent.date_start)
    )
    return [_event_dict(e) for e in result.scalars().all()]


@router.post("", status_code=201)
async def create_event(
    camp_id: str,
    data: CalendarEventCreate,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    event = AppCalendarEvent(
        camp_id=camp_id,
        title=data.title,
        description=data.description,
        date_start=data.date_start,
        date_end=data.date_end,
        time_start=data.time_start,
        time_end=data.time_end,
        color=data.color,
        created_by=user_id,
        task_id=data.task_id,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return _event_dict(event)


@router.patch("/{event_id}")
async def update_event(
    camp_id: str,
    event_id: str,
    data: CalendarEventUpdate,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(AppCalendarEvent, event_id)
    if not event or event.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Wydarzenie nie istnieje")

    for field in ("title", "description", "time_start", "time_end", "color", "task_id", "date_start", "date_end"):
        val = getattr(data, field, None)
        if val is not None:
            setattr(event, field, val)
    event.updated_at = _now()
    await db.commit()
    await db.refresh(event)
    return _event_dict(event)


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    camp_id: str,
    event_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    event = await db.get(AppCalendarEvent, event_id)
    if not event or event.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Wydarzenie nie istnieje")
    await db.delete(event)
    await db.commit()
