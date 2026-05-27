"""
schemas/external_users.py — schematy dla przybocznych.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from services.validators import validate_pl_phone, validate_pl_name


class InviteMember(BaseModel):
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

    @field_validator("email")
    @classmethod
    def email_clean(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Email jest wymagany")
        if "@" not in v:
            raise ValueError("Nieprawidłowy format email")
        return v.strip().lower()

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return validate_pl_name(v, "Imię i nazwisko")

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: Optional[str]) -> Optional[str]:
        return validate_pl_phone(v)

    @field_validator("role")
    @classmethod
    def role_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 50:
            raise ValueError("Rola może mieć maksymalnie 50 znaków")
        return v


class CreateGuest(BaseModel):
    email: str
    name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def email_clean(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Email jest wymagany")
        if "@" not in v:
            raise ValueError("Nieprawidłowy format email")
        return v.strip().lower()

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(v) > 200:
            raise ValueError("Imię/nazwisko może mieć maksymalnie 200 znaków")
        return v


class GuestLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_clean(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Email jest wymagany")
        if "@" not in v:
            raise ValueError("Nieprawidłowy format email")
        return v.strip().lower()


class ChangePassword(BaseModel):
    sessionToken: str = ""
    oldPassword: str = ""
    newPassword: str = ""


class UpdateMember(BaseModel):
    active: Optional[bool] = None
    robert_enabled: Optional[bool] = None
    display_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: Optional[str]) -> Optional[str]:
        return validate_pl_phone(v)

    @field_validator("display_name")
    @classmethod
    def name_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v.strip() or len(v) > 200):
            raise ValueError("Imię/nazwisko musi mieć 1-200 znaków")
        return v.strip() if v else v

    @field_validator("role")
    @classmethod
    def role_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 50:
            raise ValueError("Rola może mieć maksymalnie 50 znaków")
        return v
