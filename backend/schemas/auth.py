from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


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

    @field_validator("display_name")
    @classmethod
    def name_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Imię i nazwisko nie może być puste")
            if len(v) > 100:
                raise ValueError("Imię i nazwisko może mieć maksymalnie 100 znaków")
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


class AcceptInviteIn(BaseModel):
    token: str
