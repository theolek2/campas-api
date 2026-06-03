"""
routers/uldk.py — proxy ULDK (GUGIK) + BDL (nadleśnictwa/leśnictwa) + NFZ + PSP/Policja.
Prefix: /api/uldk
"""
import re
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies import get_current_user

router = APIRouter(prefix="/api/uldk", tags=["uldk"])

ULDK_BASE = "https://uldk.gugik.gov.pl/"
PARCEl_ID_RE = re.compile(r"^\d{6}_\d{1,4}\.[\dA-Za-z_./]+$")
RESULT_FIELDS = "dzialka,geom_wkt,powiat,gmina,obreb,numer,teryt"


def wgs84_to_epsg2180(lat: float, lng: float):
    """Konwersja EPSG:4326 (WGS84) → EPSG:2180 (PUWG 1992)."""
    import math
    a = 6378137.0
    e2 = 0.00669438002290
    lon0 = math.radians(19.0)
    k0 = 0.9993
    lat_rad = math.radians(lat)
    sin_lat = math.sin(lat_rad)
    cos_lat = math.cos(lat_rad)
    tan_lat = sin_lat / cos_lat
    nu = a / math.sqrt(1 - e2 * sin_lat * sin_lat)
    M = a * (
        (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256) * lat_rad
        - (3*e2/8 + 3*e2*e2/32 + 45*e2*e2*e2/1024) * math.sin(2*lat_rad)
        + (15*e2*e2/256 + 45*e2*e2*e2/1024) * math.sin(4*lat_rad)
        - (35*e2*e2*e2/3072) * math.sin(6*lat_rad)
    )
    delta_lng = math.radians(lng) - lon0
    eta2 = e2 * cos_lat * cos_lat / (1 - e2)
    x = 500000.0 + k0 * nu * delta_lng * cos_lat * (1 + delta_lng*delta_lng/6 * cos_lat*cos_lat * (1 - tan_lat*tan_lat + eta2))
    y = -5300000.0 + k0 * (M + nu * tan_lat * delta_lng*delta_lng/2 * cos_lat*cos_lat * (1 + delta_lng*delta_lng/12 * cos_lat*cos_lat * (5 - tan_lat*tan_lat + 9*eta2 + 4*eta2*eta2)))
    return round(x, 3), round(y, 3)


def epsg2180_to_wgs84(x: float, y: float):
    """Konwersja EPSG:2180 (PUWG 1992) → EPSG:4326."""
    import math
    a = 6378137.0
    e2 = 0.00669438002290
    lon0 = math.radians(19.0)
    k0 = 0.9993
    x -= 500000.0
    y += 5300000.0
    lat = y / a
    for _ in range(6):
        sin_lat = math.sin(lat)
        nu = a / math.sqrt(1 - e2 * sin_lat * sin_lat)
        M = a * (
            (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256) * lat
            - (3*e2/8 + 3*e2*e2/32 + 45*e2*e2*e2/1024) * math.sin(2*lat)
            + (15*e2*e2/256 + 45*e2*e2*e2/1024) * math.sin(4*lat)
            - (35*e2*e2*e2/3072) * math.sin(6*lat)
        )
        delta = (y - M) / (k0 * nu)
        lat += delta
        if abs(delta) < 1e-12:
            break
    sin_lat = math.sin(lat)
    cos_lat = math.cos(lat)
    tan_lat = sin_lat / cos_lat
    nu = a / math.sqrt(1 - e2 * sin_lat * sin_lat)
    eta2 = e2 * cos_lat * cos_lat / (1 - e2)
    x_k0_nu = x / (k0 * nu)
    lng = lon0 + x_k0_nu / cos_lat * (
        1 - x_k0_nu*x_k0_nu/6 * (1 + 2*tan_lat*tan_lat + eta2)
    )
    return {"lat": round(math.degrees(lat), 6), "lng": round(math.degrees(lng), 6)}


def centroid_from_wkt(wkt: str):
    """Wyciąga centroid z geometrii WKT i konwertuje z EPSG:2180 na WGS84."""
    coords = re.findall(r"(\d+\.?\d*)\s+(\d+\.?\d*)", wkt)
    if not coords:
        return None
    xs = [float(x) for x, _ in coords]
    ys = [float(y) for _, y in coords]
    cx = sum(xs) / len(xs)
    cy = sum(ys) / len(ys)
    if cx > 180 or cy > 90:
        return epsg2180_to_wgs84(cx, cy)
    return {"lng": round(cx, 6), "lat": round(cy, 6)}


def parse_uldk_response(text: str):
    """Parsuje odpowiedź tekstową ULDK i zwraca słownik."""
    lines = text.strip().split("\n")
    if not lines or lines[0] != "0":
        return {"error": "ULDK zwrócił błąd", "raw": text}

    result: dict = {"raw": text, "fields": {}}

    if len(lines) == 2 and "|" in lines[1]:
        parts = lines[1].split("|")
        field_map = {0: "geom_wkt", 1: "powiat", 2: "gmina", 3: "obreb", 4: "numer", 5: "teryt"}
        for i, name in field_map.items():
            if i + 1 < len(parts):
                result["fields"][name] = parts[i + 1]
        if len(parts) > 6:
            result["fields"]["dzialka"] = parts[6]
    else:
        field_names = RESULT_FIELDS.split(",")
        for i, name in enumerate(field_names):
            if i + 1 < len(lines):
                result["fields"][name] = lines[i + 1]

    wkt = result["fields"].get("geom_wkt", "")
    if wkt:
        centroid = centroid_from_wkt(wkt)
        if centroid:
            result["centroid"] = centroid

    return result


# ── ULDK proxy ─────────────────────────────────────────────────────────────────
@router.get("")
async def uldk_proxy(
    request: str = Query(..., description="GetParcelByXY | GetParcelById"),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    xy: str | None = Query(None, description="'lng,lat' w WGS84 lub 'x,y' w EPSG:2180"),
    id: str | None = Query(None, description="Identyfikator działki np. 146501_1.0001.12"),
    user_id: str = Depends(get_current_user),
):
    params: dict = {"request": request}

    if request == "GetParcelByXY":
        if xy:
            parts = xy.split(",")
            fx, fy = float(parts[0]), float(parts[1])
            # Jeśli wartości wyglądają jak WGS84 (małe liczby), konwertuj
            if abs(fx) <= 180 and abs(fy) <= 90:
                cx, cy = wgs84_to_epsg2180(fy, fx)
            else:
                cx, cy = fx, fy
            params["xy"] = f"{cx},{cy}"
        elif lat is not None and lng is not None:
            cx, cy = wgs84_to_epsg2180(lat, lng)
            params["xy"] = f"{cx},{cy}"
        else:
            raise HTTPException(status_code=400, detail="Podaj xy lub lat+lng")

    elif request == "GetParcelById":
        if not id:
            raise HTTPException(status_code=400, detail="Podaj id działki")
        if not PARCEl_ID_RE.match(id):
            raise HTTPException(status_code=422, detail=f"Nieprawidłowy format działki: {id}")
        params["id"] = id

    else:
        raise HTTPException(status_code=400, detail=f"Nieznane zapytanie: {request}")

    params["result"] = RESULT_FIELDS

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

    return parse_uldk_response(r.text)


# ── BDL — Nadleśnictwo + Leśnictwo ────────────────────────────────────────────
@router.get("/forest-district")
async def forest_district(lat: float = Query(...), lng: float = Query(...), user_id: str = Depends(get_current_user)):
    d = 0.0001
    bbox = f"{lng - d},{lat - d},{lng + d},{lat + d}"
    result = {"nadlesnictwo": None, "lesnictwo": None}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://ogcapi.bdl.lasy.gov.pl/collections/nadlesnictwa/items", params={"bbox": bbox, "limit": 1, "f": "json"})
            if r.status_code == 200:
                feat = r.json().get("features", [None])[0]
                if feat:
                    result["nadlesnictwo"] = feat["properties"].get("inspectorate_name")
            r2 = await client.get("https://ogcapi.bdl.lasy.gov.pl/collections/lesnictwa/items", params={"bbox": bbox, "limit": 1, "f": "json"})
            if r2.status_code == 200:
                feat2 = r2.json().get("features", [None])[0]
                if feat2:
                    result["lesnictwo"] = feat2["properties"].get("forest_range_name")
    except Exception:
        pass
    return result


# ── PSP — dane kontaktowe z gov.pl ────────────────────────────────────────────
@router.get("/psp")
async def get_psp_info(
    powiat: str = Query(..., description="Nazwa powiatu (np. białobrzeski)"),
    city: str | None = Query(None, description="Nazwa miasta powiatowego (np. Białobrzegi)"),
    user_id: str = Depends(get_current_user),
):
    """Scrapuje dane kontaktowe PSP z gov.pl dla danego powiatu."""
    import re as _re

    def to_slug(s):
        return s.lower().strip().translate(str.maketrans("ąćęłńóśźż ", "acelnoszz-"))

    candidates = []
    if city:
        candidates.append(to_slug(city))

    powiat_slug = to_slug(powiat.replace("powiat ", ""))
    candidates.append(powiat_slug)

    base = _re.sub(r"(ski|cki|dzki|owski)$", "", powiat_slug)
    if base != powiat_slug:
        for ending in ["gi", "i", "o", "a", ""]:
            candidates.append(base + ending)

    seen = set()
    unique = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            unique.append(c)

    for city_slug in unique:
        url = f"https://www.gov.pl/web/kppsp-{city_slug}/dane-kontaktowe"
        result = await _scrape_gov(url)
        if result:
            return result

    raise HTTPException(status_code=404, detail=f"Nie znaleziono strony PSP dla powiatu: {powiat}")


async def _scrape_gov(url: str):
    """Scraper stron gov.pl — zwraca {name, address, phone, email} lub None."""
    import re as _re
    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=True, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }) as client:
            r = await client.get(url)
            if r.status_code != 200:
                return None
            html = r.text

        name = ""
        title_match = _re.search(r"<title>([^<]+)</title>", html)
        if title_match:
            title = title_match.group(1)
            for p in title.split(" - "):
                p = p.strip()
                if p and p not in ("Portal Gov.pl", "Dane kontaktowe") and ("Komenda" in p or "Policji" in p or "PSP" in p):
                    name = p
                    break

        if not name:
            h1_match = _re.search(r"<h1[^>]*>([^<]+)</h1>", html)
            if h1_match:
                name = h1_match.group(1).strip()

        addr_match = _re.search(r"((?:ul\.|Ul\.)\s*[^<]+\d{2}-\d{3}\s+\w[^<]+)", html)
        phone_match = _re.search(r"tel\.?\s*([+\d\s]{5,30})", html)
        email_match = _re.search(r"([\w.-]+@[\w.-]+\.\w+)", html)

        if name:
            return {
                "name": name.strip(),
                "address": addr_match.group(1).strip().rstrip(") ;") if addr_match else "",
                "phone": phone_match.group(1).strip() if phone_match else "",
                "email": email_match.group(1).strip() if email_match else "",
                "url": url,
            }
    except Exception:
        pass
    return None


# ── Policja — Nominatim ────────────────────────────────────────────────────────
@router.get("/police")
async def get_police_info(
    powiat: str = Query(..., description="Nazwa powiatu (np. białobrzeski)"),
    user_id: str = Depends(get_current_user),
):
    """Wyszukuje komendę Policji przez Nominatim."""
    import re as _re
    p = powiat.lower().replace("powiat ", "").strip()
    is_city = not _re.search(r"(ski|cki|dzki|owski)$", p)
    query = f"Komenda Miejska Policji {p}" if is_city else f"Komenda Powiatowa Policji {p}"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://nominatim.openstreetmap.org/search", params={
                "format": "json", "q": query, "limit": 3, "accept-language": "pl", "countrycodes": "pl",
            }, headers={"User-Agent": "Campas/2.0"})
            if r.status_code != 200:
                raise HTTPException(status_code=502, detail="Nominatim niedostępny")
            data = r.json()
            if not isinstance(data, list) or not data:
                raise HTTPException(status_code=404, detail=f"Nie znaleziono komendy Policji dla: {powiat}")

            item = data[0]
            return {
                "name": item.get("display_name", "").split(",")[0].strip(),
                "address": item.get("display_name", ""),
                "phone": "",
                "email": "",
                "lat": float(item.get("lat", 0)),
                "lng": float(item.get("lon", 0)),
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Nominatim error: {str(e)}")


# ── NFZ — najbliższe placówki z telefonami (POZ + szpitale) ───────────────────
NFZ_PROVINCE_MAP = {
    "dolnośląskie": "01", "kujawsko-pomorskie": "02", "lubelskie": "06",
    "lubuskie": "08", "łódzkie": "10", "małopolskie": "12", "mazowieckie": "14",
    "opolskie": "16", "podkarpackie": "18", "podlaskie": "20", "pomorskie": "22",
    "śląskie": "24", "świętokrzyskie": "26", "warmińsko-mazurskie": "28",
    "wielkopolskie": "30", "zachodniopomorskie": "32",
}

NFZ_POZ_BENEFITS = ["POZ", "podstawowa opieka", "lekarz podstawowej", "lekarz POZ"]
NFZ_HOSPITAL_BENEFITS = ["oddział", "szpital", "chirurg", "intern", "kardiol", "neurol",
    "ortop", "pediatr", "ginek", "urolog", "laryng", "okul", "anestezj", "intensywn",
    "ratunk", "SOR", "izba przyjęć", "zakaźn", "pulmon", "onkolog", "psychiatr"]


@router.get("/nfz-places")
async def nfz_places(
    lat: float = Query(...),
    lng: float = Query(...),
    kind: str = Query("poz", description="poz | szpital"),
):
    if kind == "szpital":
        nfz_case = 2
        benefit_keywords = NFZ_HOSPITAL_BENEFITS
    else:
        nfz_case = 1
        benefit_keywords = NFZ_POZ_BENEFITS

    results: list[dict] = []
    try:
        geocode = await _reverse_geocode_nominatim(lat, lng)
        woj_raw = geocode.get("wojewodztwo", "").lower()
        woj_code = None
        for name, code in NFZ_PROVINCE_MAP.items():
            if name in woj_raw:
                woj_code = code
                break
        if not woj_code:
            woj_code = "14"
    except Exception:
        woj_code = "14"

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            for page in (1, 2, 3):
                r = await client.get(
                    "https://api.nfz.gov.pl/app-itl-api/queues",
                    params={"case": nfz_case, "province": woj_code, "page": page, "limit": 100, "format": "json"},
                )
                if r.status_code != 200:
                    break
                entries = r.json().get("data", [])
                if not entries:
                    break
                for entry in entries:
                    attr = entry.get("attributes", {})
                    benefit = (attr.get("benefit") or "").lower()
                    if not any(kw.lower() in benefit for kw in benefit_keywords):
                        continue
                    clat = attr.get("latitude")
                    clng = attr.get("longitude")
                    if clat is None or clng is None:
                        continue
                    results.append({
                        "name": attr.get("provider") or attr.get("place", ""),
                        "place": attr.get("place", ""),
                        "address": attr.get("address", ""),
                        "locality": attr.get("locality", ""),
                        "phone": attr.get("phone", ""),
                        "lat": clat,
                        "lng": clng,
                        "provider_code": attr.get("provider-code", ""),
                    })
    except Exception:
        return []

    seen: dict = {}
    uniq = []
    for item in results:
        key = item["provider_code"] or item["address"]
        if key in seen:
            continue
        seen[key] = True
        uniq.append(item)

    def haversine(lat1, lng1, lat2, lng2):
        from math import radians, sin, cos, sqrt, atan2
        R = 6371
        dlat = radians(lat2 - lat1)
        dlng = radians(lng2 - lng1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
        return R * 2 * atan2(sqrt(a), sqrt(1 - a))

    uniq.sort(key=lambda x: haversine(lat, lng, x["lat"], x["lng"]))
    for item in uniq:
        item["distance_km"] = round(haversine(lat, lng, item["lat"], item["lng"]), 1)

    return uniq[:5]


@router.get("/nfz-poz")
async def nfz_poz_compat(lat: float = Query(...), lng: float = Query(...)):
    return await nfz_places(lat, lng, kind="poz")


async def _reverse_geocode_nominatim(lat: float, lng: float) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"format": "json", "lat": lat, "lon": lng, "zoom": 10, "accept-language": "pl", "addressdetails": 1},
            headers={"User-Agent": "CampAs/2.0"},
        )
        if r.status_code != 200:
            return {}
        data = r.json()
        addr = data.get("address", {})
        return {"wojewodztwo": addr.get("state", "")}
