from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class PlanItemOut(BaseModel):
    id: str
    camp_id: str
    day_date: Optional[date]
    time_start: Optional[str]
    time_end: Optional[str]
    title: str
    description: Optional[str]
    category: Optional[str]
    patrol_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlanItemCreate(BaseModel):
    day_date: Optional[date] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    patrol_id: Optional[str] = None


class PlanItemUpdate(BaseModel):
    day_date: Optional[date] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    patrol_id: Optional[str] = None
