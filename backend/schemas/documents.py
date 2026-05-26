from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class DocumentOut(BaseModel):
    id: str
    camp_id: str
    created_by: str
    type: str
    title: str
    content: Optional[Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentCreate(BaseModel):
    type: str
    title: str
    content: Optional[Any] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Any] = None


class ParticipantOut(BaseModel):
    id: str
    camp_id: str
    patrol_id: Optional[str]
    first_name: str
    last_name: str
    birth_date: Optional[Any]
    pesel: Optional[str]
    address: Optional[str]
    parent_name: Optional[str]
    parent_phone: Optional[str]
    notes: Optional[str]

    model_config = {"from_attributes": True}


class ParticipantCreate(BaseModel):
    patrol_id: Optional[str] = None
    first_name: str
    last_name: str
    birth_date: Optional[Any] = None
    pesel: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    notes: Optional[str] = None
