"""
routers/documents.py — dokumenty obozowe i lista uczestników.
Tabele: app_documents, app_participants
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import require_camp_access
from models.app import AppDocument, AppParticipant
from schemas.documents import DocumentOut, DocumentCreate, DocumentUpdate, ParticipantOut, ParticipantCreate

router = APIRouter(prefix="/api/camps/{camp_id}", tags=["documents"])


# ── Dokumenty ─────────────────────────────────────────────────────────────────

@router.get("/documents", response_model=list[DocumentOut])
async def list_documents(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppDocument)
        .where(AppDocument.camp_id == camp_id)
        .order_by(AppDocument.created_at.desc())
    )
    return result.scalars().all()


@router.post("/documents", response_model=DocumentOut, status_code=201)
async def create_document(
    camp_id: str,
    data: DocumentCreate,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    doc = AppDocument(camp_id=camp_id, created_by=user_id, **data.model_dump())
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("/documents/{doc_id}", response_model=DocumentOut)
async def get_document(
    camp_id: str,
    doc_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(AppDocument, doc_id)
    if not doc or doc.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Dokument nie istnieje")
    return doc


@router.patch("/documents/{doc_id}", response_model=DocumentOut)
async def update_document(
    camp_id: str,
    doc_id: str,
    data: DocumentUpdate,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(AppDocument, doc_id)
    if not doc or doc.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Dokument nie istnieje")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(doc, field, value)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(
    camp_id: str,
    doc_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(AppDocument, doc_id)
    if not doc or doc.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Dokument nie istnieje")
    await db.delete(doc)
    await db.commit()


# ── Uczestnicy ────────────────────────────────────────────────────────────────

@router.get("/participants", response_model=list[ParticipantOut])
async def list_participants(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppParticipant)
        .where(AppParticipant.camp_id == camp_id)
        .order_by(AppParticipant.last_name, AppParticipant.first_name)
    )
    return result.scalars().all()


@router.post("/participants", response_model=ParticipantOut, status_code=201)
async def add_participant(
    camp_id: str,
    data: ParticipantCreate,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    p = AppParticipant(camp_id=camp_id, **data.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.patch("/participants/{p_id}", response_model=ParticipantOut)
async def update_participant(
    camp_id: str,
    p_id: str,
    data: dict,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    p = await db.get(AppParticipant, p_id)
    if not p or p.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Uczestnik nie istnieje")
    allowed = {"patrol_id", "first_name", "last_name", "birth_date", "pesel", "address", "parent_name", "parent_phone", "notes"}
    for field, value in data.items():
        if field in allowed:
            setattr(p, field, value)
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/participants/{p_id}", status_code=204)
async def delete_participant(
    camp_id: str,
    p_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    p = await db.get(AppParticipant, p_id)
    if not p or p.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Uczestnik nie istnieje")
    await db.delete(p)
    await db.commit()
