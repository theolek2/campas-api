"""
routers/robert.py — Asystent Robert (proxy DeepSeek + Jina embeddings).
Prefix: /api/robert
"""
import os
import re
import json
import subprocess
import httpx
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

from dependencies import get_current_user
from schemas.robert import RobertAsk, RobertSuggestMeal, CategorizeShopping

router = APIRouter(prefix="/api/robert", tags=["robert"])

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
JINA_API_KEY = os.getenv("JINA_API_KEY", "")
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
JINA_EMBED_URL = "https://api.jina.ai/v1/embeddings"

# ── Ładowanie danych ──────────────────────────────────────────────────────────
_DOCS: list = []
_FILE_MAP: dict = {}
_DATA_DIR = (Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data")
_DOCS_PATH = _DATA_DIR / "robert-docs.json"
_FILE_MAP_PATH = _DATA_DIR / "file-map.json"

if _DOCS_PATH.exists():
    try:
        _DOCS = json.loads(_DOCS_PATH.read_text(encoding="utf-8"))
    except Exception:
        _DOCS = []

if _FILE_MAP_PATH.exists():
    try:
        _FILE_MAP = json.loads(_FILE_MAP_PATH.read_text(encoding="utf-8"))
    except Exception:
        _FILE_MAP = {}


SYSTEM_PROMPT = """Jesteś Robertem — przyjaznym asystentem skautowym Stowarzyszenia Harcerstwa Katolickiego „Zawisza" (Skauci Europy).

Pomagasz drużynowym i komendantom w organizacji obozów harcerskich: dokumentach urzędowych, przepisach ppoż., prawie harcerskim, planowaniu obozu, bezpieczeństwie uczestników.

Zasady odpowiadania:
1. Jeśli kontekst zawiera odpowiedź — użyj go jako głównego źródła i powołaj się na dokument.
2. Jeśli kontekst nie zawiera odpowiedzi — możesz odpowiedzieć na podstawie ogólnej wiedzy o harcerstwie, ale wyraźnie zaznacz: "Z mojej wiedzy ogólnej (nie z dostarczonych dokumentów):".
3. NIE twierdź że "nie ma wymogu" lub "nie trzeba wysyłać dokumentów" gdy dotyczy to przepisów prawnych — zamiast tego napisz "Nie znalazłem tej informacji w dostępnych dokumentach, sprawdź aktualne przepisy."
4. Nie wymyślaj konkretnych numerów aktów prawnych ani dat jeśli ich nie masz w kontekście.

Kontekst z dokumentów skautowych:
{context}"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cosine_sim(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(x * x for x in b) ** 0.5
    return dot / (na * nb + 1e-10)


async def _embed_text(text: str) -> list[float] | None:
    if not JINA_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                JINA_EMBED_URL,
                headers={"Authorization": f"Bearer {JINA_API_KEY}", "Content-Type": "application/json"},
                json={"model": "jina-embeddings-v3", "input": text[:2000]},
            )
            r.raise_for_status()
            data = r.json()
            return data["data"][0]["embedding"]
    except Exception:
        return None


async def _batch_embed(texts: list[str]) -> list[list[float]]:
    if not JINA_API_KEY:
        return [[0.0] * 768 for _ in texts]
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            JINA_EMBED_URL,
            headers={"Authorization": f"Bearer {JINA_API_KEY}", "Content-Type": "application/json"},
            json={"model": "jina-embeddings-v3", "input": [t[:2000] for t in texts]},
        )
        r.raise_for_status()
        data = r.json()
        return [item["embedding"] for item in data["data"]]


# ── Hybrydowe wyszukiwanie: 60% semantyczne + 40% keyword (polski stemming) ──

def _keyword_scores(docs: list, question: str) -> list[float]:
    """Prosty polski stemming: pierwsze 5 znaków słowa."""
    words = [w.lower() for w in question.split() if len(w) > 3]
    stems = [w[:5] for w in words]
    if not stems:
        return [0.0] * len(docs)

    scores = []
    for d in docs:
        content = (d.get("pageContent") or d.get("content") or "").lower()
        hits = sum(1 for stem in stems if stem in content)
        scores.append(hits / len(stems))
    return scores


def _get_sources(raw_sources: list[str]) -> list[dict]:
    results = []
    seen = set()
    for src in raw_sources:
        entry = _FILE_MAP.get(src) or _FILE_MAP.get(src + ".txt") or _FILE_MAP.get(src + ".md") or _FILE_MAP.get(src + ".pdf")
        if not entry or seen.get(entry.get("title")):
            continue
        seen.add(entry.get("title"))
        results.append({"title": entry.get("title", ""), "file": entry.get("file"), "url": entry.get("url")})
    return results[:5]


async def _retrieve(question: str) -> tuple[str, list[dict]]:
    if not _DOCS:
        return "Brak dokumentów w bazie wiedzy.", []

    # Keyword scores — zawsze
    kw = _keyword_scores(_DOCS, question)

    # Semantic scores — jeśli API klucz dostępny
    sem = [0.0] * len(_DOCS)
    q_embed = await _embed_text(question)
    if q_embed:
        doc_embeds = []
        for i in range(0, len(_DOCS), 50):
            batch_texts = [d.get("pageContent") or d.get("content", "") for d in _DOCS[i : i + 50]]
            doc_embeds.extend(await _batch_embed(batch_texts))
        sem = [_cosine_sim(q_embed, e) for e in doc_embeds]

    # Scal: 60% semantyczne + 40% keyword
    scored = sorted(
        enumerate(_DOCS),
        key=lambda x: 0.6 * sem[x[0]] + 0.4 * kw[x[0]],
        reverse=True,
    )
    top = [i for i, score in scored if 0.6 * sem[i] + 0.4 * kw[i] > 0][:8]

    chunks = []
    raw_sources = []
    for i in top:
        doc = _DOCS[i]
        title = doc.get("metadata", {}).get("title") or doc.get("metadata", {}).get("source") or ""
        chunks.append(f"[{len(chunks) + 1}] ({title})\n{doc.get('pageContent') or doc.get('content', '')}")
        if title:
            raw_sources.append(title)

    context = "\n\n".join(chunks) if chunks else "Brak pasujących dokumentów w bazie wiedzy."
    sources = _get_sources(raw_sources)
    return context, sources


# ── Endpointy ────────────────────────────────────────────────────────────────

# Renderowanie PDF → PNG (przez poppler-utils)
@router.get("/render-document")
async def render_document(file: str = Query(...), page: int = Query(1), scale: int = Query(150)):
    safe = os.path.basename(file)
    pdf = (Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "dokumenty" / safe)
    if not pdf.exists():
        raise HTTPException(status_code=404, detail="PDF not found")

    cache_name = f"{pdf.stem}-p{page}-s{scale}.png"
    cache_path = pdf.parent / cache_name

    if not cache_path.exists():
        try:
            base = pdf.parent / pdf.stem
            subprocess.run(
                ["pdftoppm", "-png", "-f", str(page), "-l", str(page),
                 "-scale-to", str(scale), str(pdf), str(base)],
                check=True, capture_output=True, timeout=30,
            )
            tmp = pdf.parent / f"{pdf.stem}-{page}.png"
            if tmp.exists():
                tmp.rename(cache_path)
        except Exception:
            pass

    if cache_path.exists():
        return FileResponse(str(cache_path), media_type="image/png")

    raise HTTPException(status_code=500, detail="Render failed")


@router.post("/suggest-meal")
async def suggest_meal_ingredients(
    data: RobertSuggestMeal,
    user_id: str = Depends(get_current_user),
):
    """Zwraca listę składników do podanego posiłku dla N osób (JSON array)."""
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="Brak DEEPSEEK_API_KEY")

    prompt = (
        f'Podaj listę składników do przygotowania: "{data.meal_name}" dla {data.people_count} osób '
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
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if not match:
        raise HTTPException(status_code=500, detail="AI nie zwróciło JSON — spróbuj ponownie")

    try:
        ingredients = json.loads(match.group())
        cleaned = []
        for ing in ingredients:
            if isinstance(ing, dict) and ing.get("name"):
                cleaned.append({
                    "name": str(ing.get("name", "")).strip().lower(),
                    "qty": float(ing.get("qty", 0)),
                    "unit": str(ing.get("unit", "g")),
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
    history = data.history

    if len(question) < 2:
        raise HTTPException(status_code=400, detail="Brak pytania")

    context, sources = await _retrieve(question)
    system_prompt = SYSTEM_PROMPT.replace("{context}", context)

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-6:]:
        role = h.get("role", "user")
        if role not in ("user", "assistant"):
            role = "user"
        messages.append({"role": role, "content": h.get("content", "")})
    messages.append({"role": "user", "content": question})

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                DEEPSEEK_URL,
                headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": messages,
                    "max_tokens": 1500,
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


# ── Kategoryzacja zakupów ────────────────────────────────────────────────────

@router.post("/categorize-shopping")
async def categorize_shopping(
    data: CategorizeShopping,
    user_id: str = Depends(get_current_user),
):
    """AI kategoryzuje składniki wg działów sklepu."""
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="Brak DEEPSEEK_API_KEY")

    ing_list = ", ".join(
        f"{i.get('name', '?')} {i.get('qty', 1)}{i.get('unit', 'szt')}"
        for i in data.ingredients
    )

    prompt = (
        f"Masz listę składników: {ing_list}. Podziel je na kategorie sklepowe. "
        "Zwróć TYLKO JSON: [{\"category\":\"Nabiał\",\"items\":[{\"name\":\"mleko\",\"qty\":5,\"unit\":\"L\"}]}]. "
        "Kategorie: Nabiał, Pieczywo, Mięso i wędliny, Warzywa i owoce, Produkty sypkie, Przyprawy, Napoje, Słodycze i przekąski, Chemia i higiena, Inne. "
        "Nie zmieniaj nazw ani ilości, tylko pogrupuj."
    )

    try:
        async with httpx.AsyncClient(timeout=50) as client:
            r = await client.post(
                DEEPSEEK_URL,
                headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0,
                    "max_tokens": 1000,
                },
            )
            r.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="DeepSeek timeout — spróbuj ponownie")

    text = r.json()["choices"][0]["message"]["content"]
    json_match = re.search(r'```json\s*([\s\S]*?)```', text) or re.search(r'\[[\s\S]*\]', text)
    try:
        categories = json.loads(json_match.group(1) if json_match.group(1) else json_match.group(0))
    except Exception:
        categories = [{"category": "Wszystko", "items": data.ingredients}]

    return {"categories": categories}
