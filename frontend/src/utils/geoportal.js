// Pobieranie danych lokalizacyjnych z realnym czasem dojazdu (OSRM)
// + Overpass API (dokładna lista punktów) + BDL (nadleśnictwa) + NFZ

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
async function queryOverpass(amenity, lat, lng, radius = 40000, limit = 15) {
  try {
    const query = `[out:json];(node["amenity"="${amenity}"](around:${radius},${lat},${lng});way["amenity"="${amenity}"](around:${radius},${lat},${lng});relation["amenity"="${amenity}"](around:${radius},${lat},${lng}););out center ${limit};`
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
        operator: t.operator || '',
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
    const res = await fetch(url)
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

// ── Skróć nazwę PSP do czytelnej formy ──────────────────────────────────────
function formatPSPName(name) {
  return (name || '')
    .replace(/Państwow(ej|a)\s+Straż(y|y)\s+Pożarn(ej|a)/gi, 'PSP')
    .replace(/Komend(a|y)\s+Powiatow(a|ej)\s+PSP\s+w\s+/i, 'Komenda Powiatowa PSP w ')
    .replace(/Jednostka\s+Ratowniczo-Gaśnicza\s+(KP\s+)?PSP\s+w\s+/i, 'Komenda Powiatowa PSP w ')
}

// ── Dodaj czasy OSRM do listy punktów ───────────────────────────────────────
async function addOsrmRoutes(points, originLat, originLng) {
  if (points.length === 0) return points
  const results = await Promise.all(
    points.slice(0, 10).map(async p => {
      const route = await osrmRoute(originLng, originLat, p.lng, p.lat)
      if (route) return { ...p, ...route }
      return { ...p, duration_min: '-', distance_km: haversineKm(originLat, originLng, p.lat, p.lng) }
    })
  )
  return results
}

// ── Backend proxy BDL API — Nadleśnictwo + Leśnictwo (jeden request) ────────
async function getForestData(lat, lng) {
  try {
    const token = localStorage.getItem('campas_token') || ''
    const res = await fetch(`/api/uldk/forest-district?lat=${lat}&lng=${lng}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return null
    return await res.json()   // { nadlesnictwo, lesnictwo }
  } catch {}
  return null
}

// ── ULDK — numer i dane działki ewidencyjnej ─────────────────────────────────
export async function getParcelNumber(lat, lng) {
  try {
    const token = localStorage.getItem('campas_token') || ''
    const res = await fetch(
      `/api/uldk?request=GetParcelByXY&lat=${lat}&lng=${lng}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data?.error) return null
    const f = data.fields || {}
    return {
      dzialka: f.dzialka || null,
      powiat:  f.powiat  || null,
      gmina:   f.gmina   || null,
      obreb:   f.obreb   || null,
      numer:   f.numer   || null,
      teryt:   f.teryt   || null,
    }
  } catch {}
  return null
}

// ── Pobierz TOP 3 z filtrami jurysdykcyjnymi ────────────────────────────────
async function findWithRoute(lat, lng, amenity, adminFilter, adminValue) {
  let points = await queryOverpass(amenity, lat, lng)
  if (points.length === 0) {
    points = await searchNominatim(lat, lng, amenityLabel(amenity))
  }
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
      operator: p.operator,
      duration_min: typeof p.duration_min === 'number' ? p.duration_min : '-',
      distance_km: p.distance_km,
      phone: p.phone,
      address: p.address,
    }))
}

// ── NFZ POZ — najbliższe przychodnie przez backend proxy ────────────────────
async function findNfzPlaces(lat, lng, kind) {
  try {
    const token = localStorage.getItem('campas_token') || ''
    const res = await fetch(`/api/uldk/nfz-places?lat=${lat}&lng=${lng}&kind=${kind}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return []
    return await res.json()
  } catch { return [] }
}

// ── Overpass PSP — tylko Państwowa Straż Pożarna (operator tag) ──────────────
async function queryOverpassPsp(lat, lng, radius = 40000) {
  try {
    const query = `[out:json];(node["amenity"="fire_station"]["operator"="Państwowa Straż Pożarna"](around:${radius},${lat},${lng});way["amenity"="fire_station"]["operator"="Państwowa Straż Pożarna"](around:${radius},${lat},${lng}););out center 10;`
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
      }
    }).filter(p => p.lat && p.lng)
  } catch { return [] }
}

// ── Główna funkcja — pobierz wszystko z filtrami jurysdykcyjnymi ────────────
export async function fetchAllGeoData(lat, lng) {
  const [geo, hospitalList, policeList, pspPoints, clinicList, nfzPozList, nfzHospitals, forestData, parcel] = await Promise.allSettled([
    reverseGeocode(lat, lng),
    findWithRoute(lat, lng, 'hospital'),
    findWithRoute(lat, lng, 'police'),
    queryOverpassPsp(lat, lng),
    findWithRoute(lat, lng, 'clinic'),
    findNfzPlaces(lat, lng, 'poz'),
    findNfzPlaces(lat, lng, 'szpital'),
    getForestData(lat, lng),
    getParcelNumber(lat, lng),
  ])

  const geocode = geo.value || {}
  const woj = geocode.wojewodztwo || ''
  const gm = geocode.gmina || ''
  const powiat = geocode.powiat || ''

  // PSP — Overpass (pozycje + trasy OSRM), uzupełnij telefon z gov.pl w tle
  let fire = pspPoints.value || []
  if (fire.length > 0) {
    const withRoute = await addOsrmRoutes(fire, lat, lng)
    fire = withRoute
      .sort((a, b) => {
        const aVal = typeof a.duration_min === 'number' ? a.duration_min : 999
        const bVal = typeof b.duration_min === 'number' ? b.duration_min : 999
        return aVal - bVal
      })
      .slice(0, 3)
      .map(p => ({
        name: formatPSPName(p.name),
        duration_min: typeof p.duration_min === 'number' ? p.duration_min : '-',
        distance_km: p.distance_km,
        phone: p.phone,
        address: p.address,
      }))
  } else if (powiat) {
    // Fallback: gov.pl scraper gdy Overpass nie zwrócił PSP
    try {
      const token = localStorage.getItem('campas_token') || ''
      const cityParam = gm ? `&city=${encodeURIComponent(gm)}` : ''
      const res = await fetch(`/api/uldk/psp?powiat=${encodeURIComponent(powiat)}${cityParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const d = await res.json()
        fire = [{ name: formatPSPName(d.name), duration_min: '-', distance_km: '-', phone: d.phone, address: d.address }]
      }
    } catch {}
  }

  // Policja — Overpass (najbliższe), filtr po gminie/powiecie
  let police = (policeList.value || []).slice(0, 3)
  if (gm || powiat) {
    const region = (gm || powiat).toLowerCase()
    const filtered = police.filter(p => (p.address || '').toLowerCase().includes(region))
    if (filtered.length > 0) police = filtered
  }

  // Szpitale — tylko publiczne, uzupełnij telefony z NFZ
  let hospitals = (hospitalList.value || []).filter(h => {
    const n = (h.name || '').toLowerCase()
    return !n.includes('prywatn') && !n.includes('niepubliczn')
  })
  const nfzHosp = nfzHospitals.value || []
  if (nfzHosp.length > 0) {
    hospitals = hospitals.map(h => {
      if (h.phone) return h
      const match = nfzHosp.find(n => {
        const hn = (h.name || '').toLowerCase()
        const nn = (n.name || '').toLowerCase()
        return nn.includes(hn.slice(0, 8)) || hn.includes(nn.slice(0, 8))
      })
      return match ? { ...h, phone: match.phone } : h
    })
  }

  const fd = forestData.value || {}
  const nfzPoz = nfzPozList.value || []
  return {
    geocode,
    hospitals,
    police,
    fire,
    clinics: (clinicList.value || []).filter(c => c?.name?.trim()),
    nfzPoz,
    forest:      fd.nadlesnictwo ? { name: fd.nadlesnictwo } : null,
    forestRange: fd.lesnictwo    ? { name: fd.lesnictwo }    : null,
    parcel: parcel.value,
  }
}
