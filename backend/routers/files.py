"""
routers/files.py — pliki obozowe (app_shared_files, lokalny filesystem).
Prefix: /api/camps/{camp_id}/files
"""
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import aiofiles

from database import get_db
from dependencies import get_current_user, require_camp_access
from models.files import AppSharedFile

router = APIRouter(prefix="/api/camps/{camp_id}/files", tags=["files"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/data/uploads"))


def _file_dict(f: AppSharedFile) -> dict:
    return {
        "id":          f.id,
        "filename":    f.filename,
        "path":        f.path,
        "size":        f.size,
        "mime_type":   f.mime_type,
        "uploaded_by": f.uploaded_by,
        "camp_id":     f.camp_id,
        "task_id":     f.task_id,
        "created_at":  f.created_at.isoformat() if f.created_at else None,
    }


@router.get("")
async def list_files(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppSharedFile)
        .where(AppSharedFile.camp_id == camp_id)
        .order_by(AppSharedFile.created_at.desc())
    )
    return [_file_dict(f) for f in result.scalars().all()]


@router.post("/upload", status_code=201)
async def upload_file(
    camp_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    # Bezpieczna nazwa pliku
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    camp_dir = UPLOAD_DIR / camp_id
    camp_dir.mkdir(parents=True, exist_ok=True)
    dest = camp_dir / safe_name

    content = await file.read()
    async with aiofiles.open(dest, "wb") as f:
        await f.write(content)

    record = AppSharedFile(
        filename=file.filename,
        path=str(dest),
        size=len(content),
        mime_type=file.content_type,
        uploaded_by=user_id,
        camp_id=camp_id,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return _file_dict(record)


@router.delete("/{file_id}", status_code=204)
async def delete_file(
    camp_id: str,
    file_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(AppSharedFile, file_id)
    if not record or record.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Plik nie istnieje")

    # Usuń z dysku
    try:
        Path(record.path).unlink(missing_ok=True)
    except Exception:
        pass

    await db.delete(record)
    await db.commit()


@router.get("/dl/{file_id}")
async def download_file(
    camp_id: str,
    file_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(AppSharedFile, file_id)
    if not record or record.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Plik nie istnieje")

    path = Path(record.path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Plik nie istnieje na dysku")

    return FileResponse(
        path=str(path),
        filename=record.filename,
        media_type=record.mime_type or "application/octet-stream",
    )
