from pydantic import BaseModel, EmailStr
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
    invite_token: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    password: str


class AcceptInviteIn(BaseModel):
    token: str
