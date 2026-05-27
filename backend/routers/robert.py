"""
routers/robert.py — Asystent Robert (proxy DeepSeek + Jina embeddings).
Prefix: /api/robert
Port z api/robert.js
"""
import os
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
import httpx

from dependencies import get_current_user
from schemas.robert import RobertAsk, RobertSuggestMeal

router = APIRouter(prefix="/api/robert", tags=["robert"])

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
JINA_API_KEY     = os.getenv("JINA_API_KEY", "")
DEEPSEEK_URL     = "https://api.deepseek.com/chat/completions"
JINA_EMBED_URL   = "https://api.jina.ai/v1/embeddings"

# Ładuj docs raz przy starcie
_DOCS_PATH = Path(__file__).parent.parent / "data" / "robert-docs.json"
_DOCS: list = []
if _DOCS_PATH.exists():
    try:
        _DOCS = json.loads(_DOCS_PATH.read_text(encoding="utf-8"))
    except Exception:
        _DOCS = []


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na  = sum(x * x for x in a) ** 0.5
    nb  = sum(x * x for x in b) ** 0.5
    return dot / (na * nb + 1e-9)


async def _embed(texts: list[str]) -> list[list[float]]:
    if not JINA_API_KEY:
        return [[0.0] * 768] * len(texts)
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            JINA_EMBED_URL,
            headers={"Authorization": f"Bearer {JINA_API_KEY}", "Content-Type": "application/json"},
            json={"model": "jina-embeddings-v2-base-pl", "input": texts},
        )
        r.raise_for_status()
        data = r.json()
        return [item["embedding"] for item in data["data"]]


@router.post("/suggest-meal")
async def suggest_meal_ingredients(
    data: RobertSuggestMeal,
    user_id: str = Depends(get_current_user),
):
    """Zwraca listę składników do podanego posiłku dla N osób (JSON array)."""
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="Brak DEEPSEEK_API_KEY")

    meal_name    = data.meal_name
    people_count = data.people_count

    if not meal_name:
        raise HTTPException(status_code=400, detail="Brak nazwy posiłku")

    prompt = (
        f'Podaj listę składników do przygotowania: "{meal_name}" dla {people_count} osób '
        f'na obozie harcerskim w terenie.\n\n'
        f'Odpowiedz WYŁĄCZNIE jako tablica JSON (zero innych słów):\n'
        f'[{{"name":"składnik","qty":100,"unit":"g","perPerson":false}},...]\n\n'
        f'Dozwolone jednostki: g, kg, ml, L, szt, łyżka, łyżeczka, szklanka, opakowanie, puszka, plaster, kromka.\n'
        f'perPerson=true gdy qty dotyczy 1 osoby, false gdy całości.'
    )

    try:
        async with httpx.AsyncClient(timeout=50) as client:
            r = await client.post(
                DEEPSEEK_URL,
                headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": "Odpowiadasz TYLKO jako JSON array składników. Zero innych słów."},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 800,
                    "temperature": 0.2,
                },
            )
            r.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="DeepSeek timeout — spróbuj ponownie")

    text = r.json()["choices"][0]["message"]["content"]

    # Wyciągnij JSON array nawet jeśli AI dodało coś wokół
    import re
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="AI nie zwróciło JSON — spróbuj ponownie")

    try:
        ingredients = json.loads(match.group())
        # Walidacja i normalizacja
        cleaned = []
        for ing in ingredients:
            if isinstance(ing, dict) and ing.get("name"):
                cleaned.append({
                    "name":      str(ing.get("name", "")).strip().lower(),
                    "qty":       float(ing.get("qty", 0)),
                    "unit":      str(ing.get("unit", "g")),
                    "perPerson": bool(ing.get("perPerson", False)),
                })
        return {"ingredients": cleaned}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd parsowania JSON: {e}")


@router.post("")
async def ask_robert(
    data: RobertAsk,
    user_id: str = Depends(get_current_user),
):
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="Robert AI nie jest skonfigurowany (brak DEEPSEEK_API_KEY)")

    question = data.question
    history  = data.history

    if len(question) < 2:
        raise HTTPException(status_code=400, detail="Brak pytania")

    # Znajdź najlepsze dopasowanie dokumentów (Jina embedding)
    sources = []
    context = ""
    if _DOCS:
        try:
            q_embed = (await _embed([question]))[0]
            doc_texts = [d.get("content", "") for d in _DOCS]
            # Embeduj max 50 dokumentów naraz
            batch_size = 50
            all_embeds: list[list[float]] = []
            for i in range(0, len(doc_texts), batch_size):
                batch = await _embed(doc_texts[i:i + batch_size])
                all_embeds.extend(batch)

            scored = sorted(
                enumerate(_DOCS),
                key=lambda x: _cosine(q_embed, all_embeds[x[0]]),
                reverse=True,
            )
            top = scored[:3]
            context = "\n\n".join(
                f"[{_DOCS[i]['title']}]\n{_DOCS[i].get('content', '')}" for i, _ in top
            )
            sources = [{"title": _DOCS[i]["title"], "file": _DOCS[i].get("file")} for i, _ in top]
        except Exception:
            context = ""

    system_prompt = (
        "Jesteś Robertem — asystentem skautowym dla organizatorów obozów harcerskich "
        "w Stowarzyszeniu Harcerstwa Katolickiego 'Zawisza'. "
        "Odpowiadaj po polsku, krótko i konkretnie. "
        "Bazuj na instrukcji organizacji wypoczynku v7.3.26.\n\n"
    )
    if context:
        system_prompt += f"Kontekst z instrukcji:\n{context}"

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-6:]:  # ostatnie 6 wiadomości
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": question})

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                DEEPSEEK_URL,
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": messages,
                    "max_tokens": 1024,
                    "temperature": 0.3,
                },
            )
            r.raise_for_status()
            result = r.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="DeepSeek timeout — spróbuj ponownie za chwilę")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Błąd AI ({e.response.status_code})")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Błąd połączenia z AI: {str(e)[:80]}")

    answer = result["choices"][0]["message"]["content"]
    return {"answer": answer, "sources": sources}
