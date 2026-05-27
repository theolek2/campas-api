"""
schemas/terrains.py — schematy dla terenów.
"""
from typing import Optional
from pydantic import BaseModel, field_validator
from services.validators import validate_pl_phone


class TerrainCreate(BaseModel):
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    owner_notes: Optional[str] = None
    is_public: bool = False
    created_by: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Nazwa terenu nie może być pusta")
        if len(v) > 255:
            raise ValueError("Nazwa terenu może mieć maksymalnie 255 znaków")
        return v.strip()

    @field_validator("lat")
    @classmethod
    def lat_range(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -90 or v > 90):
            raise ValueError("Szerokość geograficzna musi być w zakresie -90 do 90")
        return v

    @field_validator("lng")
    @classmethod
    def lng_range(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -180 or v > 180):
            raise ValueError("Długość geograficzna musi być w zakresie -180 do 180")
        return v

    @field_validator("address")
    @classmethod
    def address_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 500:
            raise ValueError("Adres może mieć maksymalnie 500 znaków")
        return v

    @field_validator("owner_name")
    @classmethod
    def owner_name_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 200:
            raise ValueError("Nazwa właściciela może mieć maksymalnie 200 znaków")
        return v

    @field_validator("owner_contact")
    @classmethod
    def phone_valid(cls, v: Optional[str]) -> Optional[str]:
        return validate_pl_phone(v)

    @field_validator("owner_notes")
    @classmethod
    def notes_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 5000:
            raise ValueError("Notatki mogą mieć maksymalnie 5000 znaków")
        return v
