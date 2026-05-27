"""
schemas/calendar.py — schematy dla kalendarza obozowego.
"""
from datetime import date as Date
from typing import Optional
from pydantic import BaseModel, field_validator
from services.validators import validate_time_hh_mm, validate_time_range


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date_start: Optional[Date] = None
    date_end: Optional[Date] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    color: str = "#2d6a2d"
    task_id: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tytuł nie może być pusty")
        if len(v) > 255:
            raise ValueError("Tytuł może mieć maksymalnie 255 znaków")
        return v.strip()

    @field_validator("time_start", "time_end")
    @classmethod
    def time_format(cls, v: Optional[str]) -> Optional[str]:
        return validate_time_hh_mm(v)

    @field_validator("time_end")
    @classmethod
    def end_after_start(cls, v: Optional[str], info) -> Optional[str]:
        if v and info.data.get("time_start"):
            validate_time_range(info.data["time_start"], v)
        return v

    @field_validator("color")
    @classmethod
    def valid_color(cls, v: str) -> str:
        import re
        if not re.match(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", v):
            raise ValueError("Kolor musi być w formacie HEX (np. #2d6a2d)")
        return v


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date_start: Optional[Date] = None
    date_end: Optional[Date] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    color: Optional[str] = None
    task_id: Optional[str] = None

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

    @field_validator("color")
    @classmethod
    def valid_color(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import re
        if not re.match(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", v):
            raise ValueError("Kolor musi być w formacie HEX (np. #2d6a2d)")
        return v
