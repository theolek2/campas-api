"""
schemas/tasks.py — schematy dla zadań obozowych.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    column: str = "todo"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    order: int = 0
    deadline: Optional[str] = None  # ISO datetime string

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tytuł nie może być pusty")
        if len(v) > 500:
            raise ValueError("Tytuł może mieć maksymalnie 500 znaków")
        return v.strip()

    @field_validator("column")
    @classmethod
    def valid_column(cls, v: str) -> str:
        if v not in ("todo", "in_progress", "done", "archived"):
            raise ValueError("Nieprawidłowa kolumna")
        return v

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v: str) -> str:
        if v not in ("low", "medium", "high", "urgent"):
            raise ValueError("Nieprawidłowy priorytet")
        return v

    @field_validator("notes")
    @classmethod
    def notes_max_len(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 10000:
            raise ValueError("Notatki mogą mieć maksymalnie 10 000 znaków")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    column: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    order: Optional[int] = None
    deadline: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_len(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v.strip() or len(v) > 500):
            raise ValueError("Tytuł musi mieć 1-500 znaków")
        return v.strip() if v else v

    @field_validator("column")
    @classmethod
    def valid_column(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("todo", "in_progress", "done", "archived"):
            raise ValueError("Nieprawidłowa kolumna")
        return v

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("low", "medium", "high", "urgent"):
            raise ValueError("Nieprawidłowy priorytet")
        return v


class ChecklistCreate(BaseModel):
    text: str
    order: int = 0

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tekst nie może być pusty")
        if len(v) > 1000:
            raise ValueError("Tekst checklisty może mieć maksymalnie 1000 znaków")
        return v.strip()


class ChecklistUpdate(BaseModel):
    done: bool


class CommentCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Komentarz nie może być pusty")
        if len(v) > 5000:
            raise ValueError("Komentarz może mieć maksymalnie 5000 znaków")
        return v.strip()


class TemplateApply(BaseModel):
    template_id: str

    @field_validator("template_id")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("template_id nie może być pusty")
        return v
