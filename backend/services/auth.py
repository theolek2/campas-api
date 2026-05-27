"""
services/auth.py — helpery autoryzacji (haszowanie haseł, tokeny JWT).
"""
import re
import secrets
import datetime
import bcrypt
import jwt

from config import settings

_SPECIAL_CHARS = re.compile(r"[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/`~]")


def validate_password(password: str) -> str | None:
    """Pełna walidacja hasła. Zwraca komunikat błędu lub None jeśli OK."""
    if len(password) < 10:
        return "Hasło musi mieć co najmniej 10 znaków"
    if not _SPECIAL_CHARS.search(password):
        return "Hasło musi zawierać znak specjalny (!@#$%^&...)"
    if not re.search(r"[A-Z]", password):
        return "Hasło musi zawierać co najmniej 1 wielką literę"
    if not re.search(r"[a-z]", password):
        return "Hasło musi zawierać co najmniej 1 małą literę"
    if not re.search(r"\d", password):
        return "Hasło musi zawierać co najmniej 1 cyfrę"
    return None


def generate_password() -> str:
    """Generuje bezpieczne hasło spełniające politykę (dla gości)."""
    return secrets.token_urlsafe(12) + "!"


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
