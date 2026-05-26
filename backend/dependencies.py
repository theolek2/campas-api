"""
dependencies.py — FastAPI dependencies używane w wielu routerach.
Import: from dependencies import get_current_user, require_camp_access, require_admin
"""
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.shared import User, CampAccess

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """Zwraca user_id z JWT. Rzuca 401 jeśli token nieprawidłowy."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Brak user_id w tokenie")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token wygasł")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Nieprawidłowy token")


async def require_camp_access(
    camp_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> str:
    """Rzuca 403 jeśli użytkownik nie ma dostępu do obozu."""
    result = await db.execute(
        select(CampAccess).where(
            CampAccess.camp_id == camp_id,
            CampAccess.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Brak dostępu do obozu")
    return user_id


async def require_camp_owner(
    camp_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> str:
    """Rzuca 403 jeśli użytkownik nie jest właścicielem obozu."""
    result = await db.execute(
        select(CampAccess).where(
            CampAccess.camp_id == camp_id,
            CampAccess.user_id == user_id,
            CampAccess.permissions == "owner",
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Tylko właściciel obozu może wykonać tę operację")
    return user_id


async def require_admin(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> str:
    """Rzuca 403 jeśli użytkownik nie jest adminem."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Tylko administrator może wykonać tę operację")
    return user_id
