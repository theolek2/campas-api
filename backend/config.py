"""
config.py — JEDNO miejsce na wszystkie zmienne środowiskowe.
Import: from config import settings
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./api.db"

    # Auth
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 30

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # SMTP (Resend)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@campas.pl"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def db_url(self) -> str:
        raw = self.DATABASE_URL
        if raw.startswith("postgres://"):
            return raw.replace("postgres://", "postgresql+asyncpg://", 1)
        if raw.startswith("postgresql://") and "+asyncpg" not in raw:
            return raw.replace("postgresql://", "postgresql+asyncpg://", 1)
        return raw


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.JWT_SECRET == "dev-secret-change-in-production":
        import warnings
        warnings.warn("SECURITY: JWT_SECRET używa domyślnej wartości dev. Ustaw JWT_SECRET w .env dla produkcji!", RuntimeWarning)
    return s


settings = get_settings()
