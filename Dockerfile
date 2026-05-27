# ── Stage 1: Build frontend React ────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --quiet

COPY frontend/ .
RUN npm run build
# Wynik: /app/frontend/dist/


# ── Stage 2: Python runtime ───────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Zależności systemowe (opcjonalne — aiofiles nie potrzebuje nic)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kod backendu
COPY backend/ .

# Skopiuj zbudowany frontend jako statyczne zasoby
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Dane (db + uploads) będą w volumach
VOLUME ["/data/db", "/data/uploads"]

EXPOSE 8001

# Utwórz nieuprzywilejowanego użytkownika
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app /data
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
