"""
main.py — punkt wejścia api.campas.pl
Port: 8001  (swi.campas.pl używa 8000)
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from config import settings
from database import engine
# Importuj Base ze wszystkich modeli żeby Alembic je widział
import models.shared  # noqa
import models.app     # noqa
from database import Base

from routers import auth, camps, documents, planning


@asynccontextmanager
async def lifespan(app: FastAPI):
    # W dev mode tworzy tabele automatycznie (produkcja używa Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Campas API",
    description="Planowanie obozów harcerskich — api.campas.pl",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routery
app.include_router(auth.router)
app.include_router(camps.router)
app.include_router(documents.router)
app.include_router(planning.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": "api.campas.pl"}


# Serwuj frontend (produkcja — nginx normanie to robi, ale fallback)
_static_dir = Path("../frontend/dist")
if _static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(_static_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def spa(_):
        return FileResponse(str(_static_dir / "index.html"))
