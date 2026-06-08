"""
main.py — punkt wejścia campas.pl
Port: 8001  (swi.campas.pl używa 8000)
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
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
from routers import tasks, calendar, external_users, files, ingredients, robert, uldk, join


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Upewnij się, że katalog uploads istnieje i ma prawa
    upload_dir = Path(os.getenv("UPLOAD_DIR", "/data/uploads"))
    upload_dir.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(upload_dir, 0o777)
    except (PermissionError, OSError):
        pass

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
app.include_router(join.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": "api.campas.pl", "version": "2.0.0"}


# ── Landing page (root) ────────────────────────────────────────────────────
_LANDING_HTML = """\
<!doctype html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Skauci Europy — Systemy Obozowe</title>
  <meta name="theme-color" content="#14532d" />
  <style>
    * { margin:0; padding:0; box-sizing:border-box }
    body { font-family: system-ui, -apple-system, sans-serif; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background: linear-gradient(160deg, #14532d 0%, #166534 40%, #15803d 100%); padding:2rem }
    .card { background: white; border-radius: 1.5rem; padding: 2.5rem; max-width: 28rem; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,.25) }
    h1 { text-align: center; font-size: 1.5rem; color: #14532d; margin-bottom: .5rem }
    .sub { text-align: center; font-size: .875rem; color: #6b7280; margin-bottom: 2rem }
    .btn { display: flex; align-items: center; gap: .75rem; width: 100%; padding: 1rem 1.25rem; border-radius: 1rem; font-size: 1rem; font-weight: 600; text-decoration: none; transition: all .15s; margin-bottom: .75rem }
    .btn-campas { background: #166534; color: white }
    .btn-campas:hover { background: #14532d }
    .btn-swi { background: #1e40af; color: white }
    .btn-swi:hover { background: #1e3a8a }
    .btn-icon { font-size: 1.5rem }
    .btn-desc { font-size: .75rem; opacity: .7; font-weight: 400 }
  </style>
</head>
<body>
  <div class="card">
    <h1>Skauci Europy</h1>
    <p class="sub">Wybierz system</p>
    <a href="/camp/" class="btn btn-campas">
      <span class="btn-icon">⛺</span>
      <div><div>CampAs</div><div class="btn-desc">Książka obozowa — planowanie, dokumenty, mapy</div></div>
    </a>
    <a href="https://swi.campas.pl" class="btn btn-swi">
      <span class="btn-icon">🛒</span>
      <div><div>SWI</div><div class="btn-desc">System Wspomagania Intendentów</div></div>
    </a>
  </div>
</body>
</html>"""


@app.get("/", include_in_schema=False)
async def landing(request: Request):
    host = request.headers.get("host", "")
    if "api.campas.pl" in host:
        return RedirectResponse(url="/camp/")
    return HTMLResponse(content=_LANDING_HTML)


# ── Frontend SPA (produkcja) ──────────────────────────────────────────────────
_404_HTML = """\
<!doctype html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>404 — Nie znaleziono</title>
  <style>
    body { font-family: system-ui, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background: linear-gradient(160deg, #14532d 0%, #166534 40%, #15803d 100%); color:white }
    .box { text-align:center }
    h1 { font-size:5rem; margin:0; opacity:.5 }
    a { color:#4ade80 }
  </style>
</head>
<body>
  <div class="box">
    <h1>404</h1>
    <p>Strona nie istnieje</p>
    <p><a href="/">← Strona główna</a></p>
  </div>
</body>
</html>"""


# W produkcji Caddy/nginx może to robić; tu fallback dla Dockera
_static_dir = Path(__file__).parent / "frontend" / "dist"
if not _static_dir.exists():
    _static_dir = Path("../frontend/dist")

if _static_dir.exists():
    app.mount("/camp/assets", StaticFiles(directory=str(_static_dir / "assets")), name="camp_assets")

    _filmiki_dir = _static_dir / "filmiki"
    if _filmiki_dir.exists():
        app.mount("/camp/filmiki", StaticFiles(directory=str(_filmiki_dir)), name="camp_filmiki")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str = ""):
        # /camp/* → SPA (strip prefix, serve file or index.html fallback)
        if full_path.startswith("camp/"):
            rel = full_path[5:]  # strip "camp/"
            file_path = _static_dir / rel
            if rel and file_path.is_file():
                return FileResponse(str(file_path))
            return FileResponse(str(_static_dir / "index.html"))
        # Other unmatched paths → 404
        return HTMLResponse(content=_404_HTML, status_code=404)
