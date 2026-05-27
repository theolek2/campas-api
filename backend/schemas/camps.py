from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Literal
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

    @field_validator("unit_name")
    @classmethod
    def name_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 255:
            raise ValueError("Nazwa jednostki może mieć maksymalnie 255 znaków")
        return v

    @model_validator(mode="after")
    def end_after_start(self):
        if self.date_end < self.date_start:
            raise ValueError("Data końca obozu nie może być wcześniejsza niż data początku")
        return self


class CampUpdate(BaseModel):
    unit_name: Optional[str] = None
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    terrain_id: Optional[str] = None

    @field_validator("unit_name")
    @classmethod
    def name_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 255:
            raise ValueError("Nazwa jednostki może mieć maksymalnie 255 znaków")
        return v


class PatrolCreate(BaseModel):
    patrol_name: Optional[str] = None
    people_number: Optional[int] = None

    @field_validator("patrol_name")
    @classmethod
    def name_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 100:
            raise ValueError("Nazwa zastępu może mieć maksymalnie 100 znaków")
        return v

    @field_validator("people_number")
    @classmethod
    def check_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None:
            if v <= 0:
                raise ValueError("Liczba osób musi być dodatnia")
            if v > 200:
                raise ValueError("Liczba osób nie może przekraczać 200")
        return v


class PatrolOut(BaseModel):
    id: str
    camp_id: Optional[str]
    patrol_name: Optional[str]
    people_number: Optional[int]

    model_config = {"from_attributes": True}


class InviteCreate(BaseModel):
    type: Literal["multi", "single"] = "multi"
    email: Optional[str] = None

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: Optional[str], info) -> Optional[str]:
        if info.data.get("type") == "single" and not v:
            raise ValueError("Zaproszenie jednorazowe wymaga podania emaila")
        if v and "@" not in v:
            raise ValueError("Nieprawidłowy format email")
        return v.lower().strip() if v else v
