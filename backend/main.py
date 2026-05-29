"""
main.py — punkt wejścia campas.pl
Port: 8001  (swi.campas.pl używa 8000)
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException
from pathlib import Path

from config import settings
from database import engine
# Importuj Base ze wszystkich modeli żeby Alembic je widział
import models.shared   # noqa
import models.app      # noqa
import models.tasks    # noqa
import models.calendar # noqa
import models.external # noqa
import models.files    # noqa
import models.ingredients  # noqa
from database import Base

from routers import auth, camps, documents, planning, terrains
from routers import tasks, calendar, external_users, files, ingredients, robert, uldk


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Upewnij się, że katalog uploads istnieje
    upload_dir = Path(os.getenv("UPLOAD_DIR", "/data/uploads"))
    upload_dir.mkdir(parents=True, exist_ok=True)

    # W dev mode tworzy tabele automatycznie (produkcja używa Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Campas API",
    description="Planowanie obozów harcerskich — campas.pl",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routery core ──────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(camps.router)
app.include_router(terrains.router)
app.include_router(documents.router)
app.include_router(planning.router)

# ── Routery API ───────────────────────────────────────────────────────
app.include_router(tasks.router)
app.include_router(calendar.router)
app.include_router(external_users.router)
app.include_router(files.router)
app.include_router(ingredients.router)
app.include_router(robert.router)
app.include_router(uldk.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": "campas.pl", "version": "2.0.0"}


# ── Frontend SPA (produkcja) ──────────────────────────────────────────────────
# W produkcji Caddy/nginx może to robić; tu fallback dla Dockera
_static_dir = Path(__file__).parent / "frontend" / "dist"
if not _static_dir.exists():
    _static_dir = Path("../frontend/dist")

if _static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(_static_dir / "assets")), name="assets")

    _filmiki_dir = _static_dir / "filmiki"
    if _filmiki_dir.exists():
        app.mount("/filmiki", StaticFiles(directory=str(_filmiki_dir)), name="filmiki")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str = ""):
        file_path = _static_dir / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(_static_dir / "index.html"))
