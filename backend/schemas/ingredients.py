"""
schemas/ingredients.py — schematy dla składników.
"""
from typing import Optional
from pydantic import BaseModel, field_validator


class IngredientCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Nazwa składnika nie może być pusta")
        if len(v) > 200:
            raise ValueError("Nazwa składnika może mieć maksymalnie 200 znaków")
        return v


class IngredientSeed(BaseModel):
    names: list[str]

    @field_validator("names")
    @classmethod
    def names_valid(cls, v: list[str]) -> list[str]:
        for name in v:
            if not name or not name.strip():
                raise ValueError("Nazwa składnika nie może być pusta")
        return [n.strip().lower() for n in v if n.strip()]
