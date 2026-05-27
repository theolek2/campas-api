from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date as Date, datetime
from services.validators import validate_pesel, validate_pl_phone, validate_pl_name, validate_not_future


class DocumentOut(BaseModel):
    id: str
    camp_id: str
    created_by: str
    type: str
    title: str
    content: Optional[dict]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentCreate(BaseModel):
    type: str
    title: str
    content: Optional[dict] = None

    @field_validator("type")
    @classmethod
    def type_len(cls, v: str) -> str:
        if len(v) > 64:
            raise ValueError("Typ dokumentu może mieć maksymalnie 64 znaki")
        return v

    @field_validator("title")
    @classmethod
    def title_valid(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tytuł nie może być pusty")
        if len(v) > 255:
            raise ValueError("Tytuł może mieć maksymalnie 255 znaków")
        return v.strip()


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[dict] = None


class ParticipantOut(BaseModel):
    id: str
    camp_id: str
    patrol_id: Optional[str]
    first_name: str
    last_name: str
    birth_date: Optional[Date]
    pesel: Optional[str]
    address: Optional[str]
    parent_name: Optional[str]
    parent_phone: Optional[str]
    notes: Optional[str]

    model_config = {"from_attributes": True}


class ParticipantCreate(BaseModel):
    patrol_id: Optional[str] = None
    first_name: str
    last_name: str
    birth_date: Optional[Date] = None
    pesel: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("first_name")
    @classmethod
    def first_name_valid(cls, v: str) -> str:
        return validate_pl_name(v, "Imię")

    @field_validator("last_name")
    @classmethod
    def last_name_valid(cls, v: str) -> str:
        return validate_pl_name(v, "Nazwisko")

    @field_validator("birth_date")
    @classmethod
    def birth_date_valid(cls, v: Optional[Date]) -> Optional[Date]:
        return validate_not_future(v)

    @field_validator("pesel")
    @classmethod
    def pesel_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        return validate_pesel(v)

    @field_validator("address")
    @classmethod
    def address_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 500:
            raise ValueError("Adres może mieć maksymalnie 500 znaków")
        return v

    @field_validator("parent_name")
    @classmethod
    def parent_name_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 200:
            raise ValueError("Imię i nazwisko opiekuna może mieć maksymalnie 200 znaków")
        return v

    @field_validator("parent_phone")
    @classmethod
    def parent_phone_valid(cls, v: Optional[str]) -> Optional[str]:
        return validate_pl_phone(v)

    @field_validator("notes")
    @classmethod
    def notes_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 2000:
            raise ValueError("Notatki mogą mieć maksymalnie 2000 znaków")
        return v


class ParticipantUpdate(BaseModel):
    patrol_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[Date] = None
    pesel: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("first_name")
    @classmethod
    def first_name_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_pl_name(v, "Imię")
        return v

    @field_validator("last_name")
    @classmethod
    def last_name_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_pl_name(v, "Nazwisko")
        return v

    @field_validator("birth_date")
    @classmethod
    def birth_date_valid(cls, v: Optional[Date]) -> Optional[Date]:
        return validate_not_future(v)

    @field_validator("pesel")
    @classmethod
    def pesel_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v or not v.strip():
            return None
        return validate_pesel(v)

    @field_validator("address")
    @classmethod
    def address_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 500:
            raise ValueError("Adres może mieć maksymalnie 500 znaków")
        return v

    @field_validator("parent_name")
    @classmethod
    def parent_name_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 200:
            raise ValueError("Imię i nazwisko opiekuna może mieć maksymalnie 200 znaków")
        return v

    @field_validator("parent_phone")
    @classmethod
    def parent_phone_valid(cls, v: Optional[str]) -> Optional[str]:
        return validate_pl_phone(v)

    @field_validator("notes")
    @classmethod
    def notes_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 2000:
            raise ValueError("Notatki mogą mieć maksymalnie 2000 znaków")
        return v
