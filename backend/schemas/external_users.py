"""
schemas/external_users.py — schematy dla przybocznych.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from services.validators import validate_pl_phone, validate_pl_name


class InviteMember(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

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
    email: EmailStr
    name: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return validate_pl_name(v, "Imię i nazwisko")


class GuestLogin(BaseModel):
    email: EmailStr
    password: str


class ChangePassword(BaseModel):
    sessionToken: str = ""
    oldPassword: str = ""
    newPassword: str = ""

    @field_validator("newPassword")
    @classmethod
    def password_policy(cls, v: str) -> str:
        from services.auth import validate_password
        err = validate_password(v)
        if err:
            raise ValueError(err)
        return v


class UpdateMember(BaseModel):
    active: Optional[bool] = None
    robert_enabled: Optional[bool] = None
    display_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

    @field_validator("display_name")
    @classmethod
    def name_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_pl_name(v, "Imię i nazwisko")
        return v

    @field_validator("role")
    @classmethod
    def role_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 50:
            raise ValueError("Rola może mieć maksymalnie 50 znaków")
        return v
