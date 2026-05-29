from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from services.validators import validate_pl_name, validate_pl_phone


class UserOut(BaseModel):
    id: str
    email: str
    role: str
    display_name: Optional[str]

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    invite_token: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_policy(cls, v: str) -> str:
        from services.auth import validate_password
        err = validate_password(v)
        if err:
            raise ValueError(err)
        return v

    @field_validator("display_name")
    @classmethod
    def name_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_pl_name(v, "Imię i nazwisko")
        return v

    @field_validator("organization")
    @classmethod
    def org_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 255:
            raise ValueError("Nazwa organizacji może mieć maksymalnie 255 znaków")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: Optional[str]) -> Optional[str]:
        return validate_pl_phone(v)

    @field_validator("invite_token")
    @classmethod
    def token_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Token zaproszenia nie może być pusty")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    password: str

    @field_validator("token")
    @classmethod
    def token_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Token nie może być pusty")
        return v

    @field_validator("password")
    @classmethod
    def password_policy(cls, v: str) -> str:
        from services.auth import validate_password
        err = validate_password(v)
        if err:
            raise ValueError(err)
        return v


class AcceptInviteIn(BaseModel):
    token: str
