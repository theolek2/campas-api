from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date as Date, datetime
from services.validators import validate_time_hh_mm, validate_time_range


class PlanItemOut(BaseModel):
    id: str
    camp_id: str
    day_date: Optional[Date]
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
    day_date: Optional[Date] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    patrol_id: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_valid(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tytuł nie może być pusty")
        if len(v) > 255:
            raise ValueError("Tytuł może mieć maksymalnie 255 znaków")
        return v.strip()

    @field_validator("description")
    @classmethod
    def description_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 5000:
            raise ValueError("Opis może mieć maksymalnie 5000 znaków")
        return v

    @field_validator("time_start", "time_end")
    @classmethod
    def time_format(cls, v: Optional[str]) -> Optional[str]:
        return validate_time_hh_mm(v)

    @field_validator("category")
    @classmethod
    def category_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 64:
            raise ValueError("Kategoria może mieć maksymalnie 64 znaki")
        return v


class PlanItemUpdate(BaseModel):
    day_date: Optional[Date] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    patrol_id: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v.strip() or len(v) > 255):
            raise ValueError("Tytuł musi mieć 1-255 znaków")
        return v.strip() if v else v

    @field_validator("time_start", "time_end")
    @classmethod
    def time_format(cls, v: Optional[str]) -> Optional[str]:
        return validate_time_hh_mm(v)
