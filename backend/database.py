"""
database.py — silnik SQLAlchemy i dependency get_db().
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from config import settings

_kwargs: dict = {}
if settings.db_url.startswith("sqlite"):
    engine = create_async_engine(settings.db_url, echo=False)
else:
    engine = create_async_engine(
        settings.db_url,
        echo=False,
        pool_size=3,
        max_overflow=5,
        pool_recycle=3600,
        **_kwargs,
    )

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
