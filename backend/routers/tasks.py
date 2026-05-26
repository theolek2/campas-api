"""
routers/tasks.py — Kanban zadań obozu (app_tasks).
Prefix: /api/camps/{camp_id}/tasks
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user, require_camp_access
from models.tasks import AppTask, AppTaskChecklist, AppTaskComment, AppTaskTemplate
from models.ingredients import AppActivityLog

router = APIRouter(prefix="/api/camps/{camp_id}/tasks", tags=["tasks"])

_now = lambda: datetime.now(timezone.utc)


# ── Helpery ───────────────────────────────────────────────────────────────────

def _task_dict(t: AppTask, checklists=None, comments=None) -> dict:
    return {
        "id":          t.id,
        "camp_id":     t.camp_id,
        "title":       t.title,
        "description": t.description,
        "column":      t.column,
        "priority":    t.priority,
        "deadline":    t.deadline.isoformat() if t.deadline else None,
        "assigned_to": t.assigned_to,
        "created_by":  t.created_by,
        "notes":       t.notes,
        "order":       t.order,
        "created_at":  t.created_at.isoformat() if t.created_at else None,
        "updated_at":  t.updated_at.isoformat() if t.updated_at else None,
        "checklists":  checklists or [],
        "comments":    comments or [],
    }

def _checklist_dict(c: AppTaskChecklist) -> dict:
    return {
        "id":       c.id,
        "task_id":  c.task_id,
        "text":     c.text,
        "done":     c.done,
        "done_by":  c.done_by,
        "done_at":  c.done_at.isoformat() if c.done_at else None,
        "order":    c.order,
    }


# ── Lista tasków ──────────────────────────────────────────────────────────────

@router.get("")
async def list_tasks(
    camp_id: str,
    column: Optional[str] = None,
    assigned_to: Optional[str] = None,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    q = select(AppTask).where(AppTask.camp_id == camp_id)
    if column:
        q = q.where(AppTask.column == column)
    if assigned_to:
        q = q.where(AppTask.assigned_to == assigned_to)
    q = q.order_by(AppTask.order, AppTask.created_at.desc())
    tasks = (await db.execute(q)).scalars().all()

    # Załaduj checklisty dla wszystkich tasków
    task_ids = [t.id for t in tasks]
    checklists_map: dict = {}
    if task_ids:
        cl_res = await db.execute(
            select(AppTaskChecklist)
            .where(AppTaskChecklist.task_id.in_(task_ids))
            .order_by(AppTaskChecklist.order)
        )
        for cl in cl_res.scalars().all():
            checklists_map.setdefault(cl.task_id, []).append(_checklist_dict(cl))

    return [_task_dict(t, checklists=checklists_map.get(t.id, [])) for t in tasks]


# ── Utwórz task ───────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_task(
    camp_id: str,
    data: dict,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    task = AppTask(
        camp_id=camp_id,
        title=data.get("title", ""),
        description=data.get("description"),
        column=data.get("column", "todo"),
        priority=data.get("priority", "medium"),
        assigned_to=data.get("assigned_to"),
        created_by=user_id,
        notes=data.get("notes"),
        order=data.get("order", 0),
    )
    if data.get("deadline"):
        task.deadline = datetime.fromisoformat(data["deadline"])
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # Log aktywności
    db.add(AppActivityLog(user_id=user_id, action="task_created",
                          entity_type="task", entity_id=task.id,
                          meta={"title": task.title}))
    await db.commit()
    return _task_dict(task)


# ── Aktualizuj task ───────────────────────────────────────────────────────────

@router.patch("/{task_id}")
async def update_task(
    camp_id: str,
    task_id: str,
    data: dict,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    task = await db.get(AppTask, task_id)
    if not task or task.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Task nie istnieje")

    old_column = task.column
    allowed = ("title", "description", "column", "priority", "assigned_to", "notes", "order")
    for field in allowed:
        if field in data:
            setattr(task, field, data[field])
    if "deadline" in data:
        task.deadline = datetime.fromisoformat(data["deadline"]) if data["deadline"] else None
    task.updated_at = _now()
    await db.commit()
    await db.refresh(task)

    # Log ruchu w kolumnie
    if "column" in data and data["column"] != old_column:
        db.add(AppActivityLog(user_id=user_id, action=f"task_move_{data['column']}",
                              entity_type="task", entity_id=task_id,
                              meta={"title": task.title, "from": old_column, "to": data["column"]}))
        await db.commit()
    return _task_dict(task)


# ── Usuń task ─────────────────────────────────────────────────────────────────

@router.delete("/{task_id}", status_code=204)
async def delete_task(
    camp_id: str,
    task_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    task = await db.get(AppTask, task_id)
    if not task or task.camp_id != camp_id:
        raise HTTPException(status_code=404, detail="Task nie istnieje")
    await db.delete(task)
    await db.commit()


# ── Checklista ────────────────────────────────────────────────────────────────

@router.get("/{task_id}/checklist")
async def list_checklist(
    camp_id: str,
    task_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppTaskChecklist)
        .where(AppTaskChecklist.task_id == task_id)
        .order_by(AppTaskChecklist.order)
    )
    return [_checklist_dict(c) for c in result.scalars().all()]


@router.post("/{task_id}/checklist", status_code=201)
async def add_checklist_item(
    camp_id: str,
    task_id: str,
    data: dict,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    item = AppTaskChecklist(
        task_id=task_id,
        text=data.get("text", ""),
        done=False,
        order=data.get("order", 0),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _checklist_dict(item)


@router.patch("/{task_id}/checklist/{item_id}")
async def toggle_checklist_item(
    camp_id: str,
    task_id: str,
    item_id: str,
    data: dict,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(AppTaskChecklist, item_id)
    if not item or item.task_id != task_id:
        raise HTTPException(status_code=404, detail="Item nie istnieje")
    item.done = data.get("done", item.done)
    item.done_by = user_id if item.done else None
    item.done_at = _now() if item.done else None
    await db.commit()
    await db.refresh(item)
    return _checklist_dict(item)


@router.delete("/{task_id}/checklist/{item_id}", status_code=204)
async def delete_checklist_item(
    camp_id: str,
    task_id: str,
    item_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(AppTaskChecklist, item_id)
    if not item or item.task_id != task_id:
        raise HTTPException(status_code=404, detail="Item nie istnieje")
    await db.delete(item)
    await db.commit()


# ── Komentarze ────────────────────────────────────────────────────────────────

@router.get("/{task_id}/comments")
async def list_comments(
    camp_id: str,
    task_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppTaskComment)
        .where(AppTaskComment.task_id == task_id)
        .order_by(AppTaskComment.created_at)
    )
    return [{"id": c.id, "task_id": c.task_id, "user_id": c.user_id,
             "user_type": c.user_type, "content": c.content,
             "created_at": c.created_at.isoformat() if c.created_at else None}
            for c in result.scalars().all()]


@router.post("/{task_id}/comments", status_code=201)
async def add_comment(
    camp_id: str,
    task_id: str,
    data: dict,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    comment = AppTaskComment(
        task_id=task_id,
        user_id=user_id,
        user_type="internal",
        content=data.get("content", ""),
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return {"id": comment.id, "task_id": comment.task_id, "user_id": comment.user_id,
            "content": comment.content, "created_at": comment.created_at.isoformat()}


# ── Szablony ──────────────────────────────────────────────────────────────────

@router.get("/templates")
async def list_templates(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AppTaskTemplate))
    return [{"id": t.id, "name": t.name, "is_default": t.is_default,
             "tasks": t.tasks} for t in result.scalars().all()]


@router.post("/templates/apply", status_code=201)
async def apply_template(
    camp_id: str,
    data: dict,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    """Zastosuj szablon — utwórz wszystkie taski z szablonu dla obozu."""
    template_id = data.get("template_id")
    template = await db.get(AppTaskTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Szablon nie istnieje")

    created = []
    for item in (template.tasks or []):
        task = AppTask(
            camp_id=camp_id,
            title=item.get("title", ""),
            column="todo",
            priority=item.get("priority", "medium"),
            notes=item.get("notes"),
            created_by=user_id,
        )
        db.add(task)
        created.append(task)
    await db.commit()
    return {"created": len(created)}


# ── Feed aktywności ───────────────────────────────────────────────────────────

@router.get("/activity")
async def activity_feed(
    camp_id: str,
    user_id: str = Depends(require_camp_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppActivityLog)
        .where(AppActivityLog.entity_type == "task")
        .order_by(AppActivityLog.created_at.desc())
        .limit(30)
    )
    return [{"id": a.id, "user_id": a.user_id, "action": a.action,
             "entity_id": a.entity_id, "meta": a.meta,
             "created_at": a.created_at.isoformat() if a.created_at else None}
            for a in result.scalars().all()]
