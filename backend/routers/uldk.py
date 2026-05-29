"""
routers/uldk.py — proxy ULDK (GUGIK) + BDL (nadleśnictwa/leśnictwa).
Prefix: /api/uldk
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies import get_current_user

router = APIRouter(prefix="/api/uldk", tags=["uldk"])

ULDK_BASE = "https://uldk.gugik.gov.pl/"


# ── Proxy BDL API ──────────────────────────────────────────────────────────
@router.get("/forest-district")
async def forest_district(lat: float = Query(...), lng: float = Query(...)):
    d = 0.0001
    bbox = f"{lng - d},{lat - d},{lng + d},{lat + d}"
    result = {"nadlesnictwo": None, "lesnictwo": None}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://ogcapi.bdl.lasy.gov.pl/collections/nadlesnictwa/items", params={"bbox": bbox, "limit": 1, "f": "json"})
            if r.status_code == 200:
                feat = r.json().get("features", [None])[0]
                if feat: result["nadlesnictwo"] = feat["properties"].get("inspectorate_name")
            r2 = await client.get("https://ogcapi.bdl.lasy.gov.pl/collections/lesnictwa/items", params={"bbox": bbox, "limit": 1, "f": "json"})
            if r2.status_code == 200:
                feat2 = r2.json().get("features", [None])[0]
                if feat2: result["lesnictwo"] = feat2["properties"].get("forest_range_name")
    except Exception:
        pass
    return result


@router.get("")
async def uldk_proxy(
    request: str = Query(..., description="Zapytanie ULDK (np. GetParcelByXY)"),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    xy: str | None = Query(None, description="Alternatywnie: '21.123456,50.654321'"),
    user_id: str = Depends(get_current_user),
):
    """
    Proxy do ULDK GUGIK. Wymaga zalogowania.
    Przykłady:
      GET /api/uldk?request=GetParcelByXY&xy=21.0122,52.2297
      GET /api/uldk?request=GetParcelByXY&lat=52.2297&lng=21.0122
    """
    params: dict = {"request": request}

    if xy:
        params["xy"] = xy
    elif lat is not None and lng is not None:
        params["xy"] = f"{lng},{lat}"

    params["result"] = "dzialka,geom_wkt,powiat,gmina,obreb,numer,teryt"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(ULDK_BASE, params=params)
            r.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="ULDK nie odpowiada (timeout)")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"ULDK error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ULDK niedostępny: {str(e)}")

    return r.text
