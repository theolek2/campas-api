"""
services/auth.py — helpery autoryzacji (haszowanie haseł, tokeny JWT).
"""
import secrets
import datetime
import bcrypt
import jwt

from config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_jwt(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub":   user_id,
        "email": email,
        "role":  role,
        "exp":   datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=settings.JWT_EXPIRE_DAYS),
        "iat":   datetime.datetime.now(datetime.UTC),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def generate_token() -> str:
    return secrets.token_urlsafe(32)
