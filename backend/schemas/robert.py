"""
schemas/robert.py — schematy dla asystenta AI Robert.
"""
from typing import Optional
from pydantic import BaseModel, field_validator


class RobertAsk(BaseModel):
    question: str
    history: list[dict] = []

    @field_validator("question")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Pytanie jest za krótkie")
        if len(v) > 5000:
            raise ValueError("Pytanie może mieć maksymalnie 5000 znaków")
        return v.strip()


class RobertSuggestMeal(BaseModel):
    meal_name: str
    people_count: int = 20

    @field_validator("meal_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Nazwa posiłku nie może być pusta")
        return v.strip()

    @field_validator("people_count")
    @classmethod
    def valid_count(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Liczba osób musi być dodatnia")
        if v > 10000:
            raise ValueError("Maksymalna liczba osób to 10000")
        return v
