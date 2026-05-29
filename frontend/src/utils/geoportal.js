// Pobieranie danych lokalizacyjnych z realnym czasem dojazdu (OSRM)
// + Overpass API (dokładna lista punktów) + WFS PRG (nadleśnictwa)
// + filtry jurysdykcyjne (PSP→województwo, Policja→gmina>powiat)

// ── Konwersja EPSG:4326 → EPSG:2180 ─────────────────────────────────────────
function toEpsg2180(lat, lng) {
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180
  const a = 6378137.0, f = 1 / 298.257222101
  const e2 = 2 * f - f * f
  const lambda0 = (19 * Math.PI) / 180, phi0 = 0, k0 = 0.9993
  const FE = 500000, FN = -5300000
  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2)
  const T = Math.tan(latRad) ** 2
  const C = (e2 / (1 - e2)) * Math.cos(latRad) ** 2
  const A = (lngRad - lambda0) * Math.cos(latRad)
  const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latRad
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latRad)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * latRad)
    - (35 * e2 ** 3 / 3072) * Math.sin(6 * latRad))
  const x = FE + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * e2) * A ** 5 / 120)
  const y = FN + k0 * (M + N * Math.tan(latRad) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * e2) * A ** 6 / 720))
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
}

// ── Nominatim reverse geocode (adres + admin) ────────────────────────────────
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=13&accept-language=pl&addressdetails=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'CampAs/2.0' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || data.error) return null
  const addr = data.address || {}
  return {
    display: data.display_name || '',
    gmina: addr.municipality || addr.county || addr.city_district || '',
    powiat: addr.county || '',
    wojewodztwo: addr.state || '',
    miejscowosc: addr.town || addr.village || addr.city || addr.hamlet || '',
    kod_pocztowy: addr.postcode || '',
  }
}

// ── OSRM — realny czas dojazdu samochodem ────────────────────────────────────
async function osrmRoute(fromLng, fromLat, toLng, toLat) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    if (!json.routes?.length) return null
    return {
      distance_km: +(json.routes[0].distance / 1000).toFixed(1),
      duration_min: Math.round(json.routes[0].duration / 60),
    }
  } catch { return null }
}

// ── Overpass API — lista punktów danego typu w promieniu ─────────────────────
async function queryOverpass(amenity, lat, lng, radius = 40000) {
  try {
    const query = `[out:json];(node["amenity"="${amenity}"](around:${radius},${lat},${lng});way["amenity"="${amenity}"](around:${radius},${lat},${lng});relation["amenity"="${amenity}"](around:${radius},${lat},${lng}););out center 15;`
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.elements || []).map(el => {
      const t = el.tags || {}
      return {
        name: t['name:pl'] || t.name || t.official_name || '',
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
        city: t['addr:city'] || t.city || '',
        state: t['addr:state'] || t.state || t.is_in || '',
        phone: t.phone || t['contact:phone'] || '',
        address: [t['addr:street'] || t.street, t['addr:city'] || t.city].filter(Boolean).join(', '),
        website: t.website || '',
      }
    }).filter(p => p.lat && p.lng)
  } catch { return [] }
}

// ── Nominatim search (fallback gdy Overpass nie ma danych) ──────────────────
async function searchNominatim(lat, lng, query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=pl&bounded=1&viewbox=${lng - 0.3},${lat - 0.2},${lng + 0.3},${lat + 0.2}`
    const res = await fetch(url, { headers: { 'User-Agent': 'CampAs/2.0' } })
    if (!res.ok) return []
    const data = await res.json()
    return (data || []).map(item => ({
      name: item.display_name?.split(',')[0]?.trim() || '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      city: item.address?.city || item.address?.town || '',
      state: item.address?.state || '',
      phone: '',
      address: item.display_name || '',
    }))
  } catch { return [] }
}

// ── Odległość w linii prostej (Haversine, fallback dla OSRM) ────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)
}

// ── Mapowanie amenity → nazwa dla Nominatim ─────────────────────────────────
function amenityLabel(amenity) {
  const map = {
    hospital: 'szpital',
    fire_station: 'straż pożarna PSP',
    police: 'komenda policji',
    clinic: 'przychodnia POZ',
  }
  return map[amenity] || amenity
}

// ── Dodaj czasy OSRM do listy punktów ───────────────────────────────────────
async function addOsrmRoutes(points, originLat, originLng) {
  if (points.length === 0) return points
  const results = await Promise.all(
    points.slice(0, 10).map(async p => {
      const route = await osrmRoute(originLng, originLat, p.lng, p.lat)
      // Fallback na odległość w linii prostej jeśli OSRM nie odpowiada
      if (route) return { ...p, ...route }
      return { ...p, duration_min: '-', distance_km: haversineKm(originLat, originLng, p.lat, p.lng) }
    })
  )
  return results
}

// ── Backend proxy BDL API — Nadleśnictwo ────────────────────────────────────
async function getForestDistrict(lat, lng) {
  try {
    const token = localStorage.getItem('campas_token') || ''
    const res = await fetch(`/api/uldk/forest-district?lat=${lat}&lng=${lng}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.nadlesnictwo ? { name: data.nadlesnictwo } : null
  } catch {}
  return null
}

// ── Backend proxy BDL API — Leśnictwo ───────────────────────────────────────
async function getForestRange(lat, lng) {
  try {
    const token = localStorage.getItem('campas_token') || ''
    const res = await fetch(`/api/uldk/forest-district?lat=${lat}&lng=${lng}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.lesnictwo ? { name: data.lesnictwo } : null
  } catch {}
  return null
}

// ── ULDK — numer działki przez Vercel proxy ─────────────────────────────────
export async function getParcelNumber(lat, lng) {
  try {
    const res = await fetch(`/api/uldk?lat=${lat}&lng=${lng}`)
    if (!res.ok) return null
    const json = await res.json()
    if (json?.raw) {
      const lines = json.raw.trim().split('\n')
      if (lines[0] === '0') return { wkbHex: lines[1] }
    }
  } catch {}
  return null
}

// ── Pobierz TOP 3 z filtrami jurysdykcyjnymi ────────────────────────────────
async function findWithRoute(lat, lng, amenity, adminFilter, adminValue) {
  // 1. Overpass
  let points = await queryOverpass(amenity, lat, lng)

  // 2. Jeśli Overpass pusto → Nominatim fallback
  if (points.length === 0) {
    points = await searchNominatim(lat, lng, amenityLabel(amenity))
  }

  // 3. Dodaj czasy OSRM (z fallbackiem na haversine)
  const withRoute = await addOsrmRoutes(points, lat, lng)

  let filtered = withRoute
  if (adminFilter && adminValue) {
    const field = adminFilter === 'state' ? 'state' : 'city'
    filtered = withRoute.filter(p => {
      const val = (p[field] || '').toLowerCase()
      return val.includes(adminValue.toLowerCase())
    })
    if (filtered.length === 0) filtered = withRoute
  }

  return filtered
    .sort((a, b) => {
      const aVal = typeof a.duration_min === 'number' ? a.duration_min : 999
      const bVal = typeof b.duration_min === 'number' ? b.duration_min : 999
      return aVal - bVal
    })
    .slice(0, 3)
    .map(p => ({
      name: p.name,
      duration_min: typeof p.duration_min === 'number' ? p.duration_min : '-',
      distance_km: p.distance_km,
      phone: p.phone,
      address: p.address,
    }))
}

// ── NFZ API — przychodnia z telefonem ───────────────────────────────────────
export async function findNfzClinic(lat, lng) {
  try {
    const url = `https://api.nfz.gov.pl/app-itl-api/queues?page=1&limit=3&format=json&api-version=1.3&sort=geodistance&lat=${lat}&lng=${lng}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const entries = json?.data?.rows || []
    if (entries.length === 0) return null
    const e = entries[0]
    return { name: e.provider_name || '', address: [e.address, e.city].filter(Boolean).join(', '), phone: e.phone || e.provider_phone || '' }
  } catch { return null }
}

// ── Główna funkcja — pobierz wszystko z filtrami jurysdykcyjnymi ────────────
export async function fetchAllGeoData(lat, lng) {
  const [geo, hospitalList, policeList, fireList, clinicList, nfz, forest, forestRange, parcel] = await Promise.allSettled([
    reverseGeocode(lat, lng),
    findWithRoute(lat, lng, 'hospital'),
    findWithRoute(lat, lng, 'police'),
    findWithRoute(lat, lng, 'fire_station'),
    findWithRoute(lat, lng, 'clinic'),
    findNfzClinic(lat, lng),
    getForestDistrict(lat, lng),
    getForestRange(lat, lng),
    getParcelNumber(lat, lng),
  ])

  const geocode = geo.value || {}
  const woj = geocode.wojewodztwo || ''
  const gm = geocode.gmina || ''

  // PSP — filtruj po nazwie (tylko państwowa, nie OSP)
  let fire = fireList.value || []
  fire = fire.filter(p => {
    const n = (p.name || '').toLowerCase()
    return n.includes('psp') || n.includes('państwowa') || n.includes('komenda')
  })
  if (woj) {
    const filtered = fire.filter(p => {
      const addr = (p.address || '').toLowerCase()
      return addr.includes(woj.toLowerCase())
    })
    if (filtered.length > 0) fire = filtered
  }

  // Policja — najpierw gmina, potem powiat, potem fallback
  let police = policeList.value || []
  if (gm || geocode.powiat) {
    let filtered = police.filter(p => {
      const addr = (p.address || '').toLowerCase()
      return addr.includes(gm.toLowerCase())
    })
    if (filtered.length === 0 && geocode.powiat) {
      filtered = police.filter(p => {
        const addr = (p.address || '').toLowerCase()
        return addr.includes(geocode.powiat.toLowerCase())
      })
    }
    if (filtered.length > 0) police = filtered
  }

  // Szpitale — tylko publiczne (odrzuć prywatne)
  let hospitals = (hospitalList.value || []).filter(h => {
    const n = (h.name || '').toLowerCase()
    return !n.includes('prywatn') && !n.includes('niepubliczn')
  })

  return {
    geocode,
    hospitals,
    police,
    fire,
    clinics: clinicList.value || [],
    nfz: nfz.value,
    forest: forest.value,
    forestRange: forestRange.value,
    parcel: parcel.value,
  }
}
