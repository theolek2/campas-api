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


@router.post("")
async def ask_robert(
    data: dict,
    user_id: str = Depends(get_current_user),
):
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="Robert AI nie jest skonfigurowany (brak DEEPSEEK_API_KEY)")

    question = data.get("question", "").strip()
    history  = data.get("history", [])

    if not question:
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

    async with httpx.AsyncClient(timeout=30) as client:
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

    answer = result["choices"][0]["message"]["content"]
    return {"answer": answer, "sources": sources}
