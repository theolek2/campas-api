from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class CampOut(BaseModel):
    id: str
    unit_name: Optional[str]
    date_start: date
    date_end: date
    terrain_id: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class CampCreate(BaseModel):
    unit_name: Optional[str] = None
    date_start: date
    date_end: date
    terrain_id: Optional[str] = None


class PatrolOut(BaseModel):
    id: str
    camp_id: Optional[str]
    patrol_name: Optional[str]
    people_number: Optional[int]

    model_config = {"from_attributes": True}
