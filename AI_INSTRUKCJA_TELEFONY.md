# Instrukcja dla AI: Import numerów telefonów służb ratunkowych

## Zasada działania

Użytkownik wpisuje współrzędne GPS obozu → system automatycznie znajduje najbliższe:
szpital, PSP, komendę policji i przychodnię NFZ — **wraz z numerami telefonów**.

Dane trafiają do:
- Zakładka **Teren** → listy radiowe (do wyboru)
- Zakładka **Kadra** → moduł "Kontakty alarmowe" (auto-wypełnione pola)
- **Dokumenty PDF** (zawiadomienia, dziennik) — pola `szpital_tel`, `policja_tel`, `tel_przychodnia`

---

## Źródła danych

| Służba | Źródło główne | Źródło telefonu | Endpoint |
|--------|--------------|----------------|----------|
| **Szpital** | Overpass OSM (nazwa, lokalizacja, czas OSRM) | **NFZ API** (`/queues`, case=2) — mergowany po nazwie | `/api/uldk/nfz-places?kind=szpital` |
| **PSP** | Overpass z tagiem `operator=Państwowa Straż Pożarna` | Overpass (`phone` tag) | — |
| **Policja** | Overpass `amenity=police` | Overpass (`phone` tag) | — |
| **Przychodnia POZ** | **NFZ API** (`/queues`, case=1, filtrowane POZ) | NFZ API | `/api/uldk/nfz-places?kind=poz` |

---

## Backend: `backend/routers/uldk.py`

### Endpoint: `GET /api/uldk/nfz-places`

```
GET /api/uldk/nfz-places?lat=50.0619&lng=19.9369&kind=poz    → przychodnie POZ
GET /api/uldk/nfz-places?lat=50.0619&lng=19.9369&kind=szpital → szpitale
```

**Flow wewnętrzny:**
1. Reverse-geocode `lat,lng` przez Nominatim → województwo (np. `"małopolskie"`)
2. Mapowanie województwo → kod NFZ (`małopolskie` → `"12"`)
3. Query NFZ `/queues?case=X&province=XX&limit=100&format=json` (3 strony)
4. Filtrowanie po `benefit`:
   - `kind=poz`: szuka słów `"POZ"`, `"podstawowa opieka"` itp.
   - `kind=szpital`: szuka `"oddział"`, `"szpital"`, `"chirurg"`, `"intern"` itp.
5. Odfiltrowanie wpisów z `latitude==null`
6. Deduplikacja po `provider-code`
7. Sortowanie Haversine po odległości od `lat,lng`
8. Zwrot top 5: `[{name, place, address, locality, phone, lat, lng, distance_km}]`

### Mapowanie województw → kod NFZ

```python
NFZ_PROVINCE_MAP = {
    "dolnośląskie": "01", "kujawsko-pomorskie": "02", "lubelskie": "06",
    "lubuskie": "08", "łódzkie": "10", "małopolskie": "12", "mazowieckie": "14",
    "opolskie": "16", "podkarpackie": "18", "podlaskie": "20", "pomorskie": "22",
    "śląskie": "24", "świętokrzyskie": "26", "warmińsko-mazurskie": "28",
    "wielkopolskie": "30", "zachodniopomorskie": "32",
}
```

---

## Frontend: `frontend/src/utils/geoportal.js`

### Funkcja `fetchAllGeoData(lat, lng)` — punkt wejścia

```javascript
// Wywoływana z CampDataTab.jsx przy kliknięciu "Pobierz" (GPS)
export async function fetchAllGeoData(lat, lng) {
  const [geo, hospitalList, policeList, pspPoints, clinicList, 
         nfzPozList, nfzHospitals, forestData, parcel] = 
    await Promise.allSettled([...])
  // ...
}
```

### Kluczowe funkcje pomocnicze

```javascript
// NFZ — dowolny rodzaj placówki
async function findNfzPlaces(lat, lng, kind)
// → GET /api/uldk/nfz-places?lat=X&lng=Y&kind=poz|szpital

// Overpass — tylko PSP (Państwowa, nie OSP)
async function queryOverpassPsp(lat, lng)
// → query: node/way["amenity"="fire_station"]["operator"="Państwowa Straż Pożarna"]

// Overpass — dowolny typ (szpital, policja, clinic)
async function queryOverpass(amenity, lat, lng)
// → wyciąga phone z tagów OSM: t.phone || t['contact:phone']
```

### Merge telefonów NFZ → Overpass (dla szpitali)

```javascript
// OSM ma nazwy i lokalizacje szpitali, ale rzadko ma telefony.
// NFZ ma telefony, ale nazwy są w innym formacie.
// Merge: dopasuj po pierwszych 8 znakach nazwy (lowercase).
const nfzHosp = nfzHospitals.value || []
if (nfzHosp.length > 0) {
  hospitals = hospitals.map(h => {
    if (h.phone) return h                        // już ma telefon z OSM
    const match = nfzHosp.find(n => {
      const hn = (h.name || '').toLowerCase()
      const nn = (n.name || '').toLowerCase()
      return nn.includes(hn.slice(0, 8)) || hn.includes(nn.slice(0, 8))
    })
    return match ? { ...h, phone: match.phone } : h
  })
}
```

---

## Frontend: `frontend/src/components/CampDataTab.jsx`

### Auto-fill po GPS (`handleGeoFetch`)

```javascript
const handleGeoFetch = async () => {
  const data = await fetchAllGeoData(lat, lng)
  const patch = { coords: { lat, lng } }
  
  // Przypisz pierwszy wynik każdej kategorii do meta
  if (data.nfzPoz?.length)    { patch.przychodnia     = data.nfzPoz[0].name
                                patch.tel_przychodnia = data.nfzPoz[0].phone }
  if (data.hospitals?.[0])    { patch.szpital    = data.hospitals[0].name
                                patch.tel_szpital = data.hospitals[0].phone }
  if (data.police?.[0])       { patch.policja     = data.police[0].name
                                patch.policja_tel = data.police[0].phone }
  if (data.fire?.[0])         { patch.psp     = data.fire[0].name
                                patch.psp_tel = data.fire[0].phone }
  
  onUpdateMeta(patch)   // zapisuje do stanu + localStorage + Supabase
}
```

### Wyświetlanie w Kadra → Kontakty alarmowe

Klawisze `meta` używane w module:
- `meta.szpital` / `meta.tel_szpital`
- `meta.policja` / `meta.policja_tel`
- `meta.przychodnia` / `meta.tel_przychodnia`
- `meta.psp` / `meta.psp_tel` (w dokumentach PDF)
- `meta.tel_zastepca`

---

## Ścieżka danych — krok po kroku

```
1. Użytkownik wpisuje lat/lng → klika "Pobierz"
2. CampDataTab.handleGeoFetch()
3.   → geoportal.fetchAllGeoData(lat, lng)
4.     → Promise.allSettled([
5.         reverseGeocode(lat,lng)     → Nominatim → województwo, gmina
6.         findWithRoute('hospital')   → Overpass  → lista szpitali (nazwy, koordynaty, OSRM)
7.         findNfzPlaces('szpital')    → Backend   → NFZ /queues → lista z TELEFONAMI
8.         merge: Overpass nazwy + NFZ telefony (dopasowanie po nazwie)
9.         findWithRoute('police')     → Overpass  → lista komend (z phone tag)
10.        queryOverpassPsp()          → Overpass  → lista PSP (z phone tag)
11.        findNfzPlaces('poz')        → Backend   → NFZ /queues → POZ z TELEFONAMI
12.     ])
13.   ← zwraca { hospitals, police, fire, nfzPoz, ... }
14. handleGeoFetch bierze pierwszy wynik z każdej listy
15.   → patch: { szpital, tel_szpital, policja, policja_tel, psp, psp_tel, 
16.              przychodnia, tel_przychodnia, ... }
17.   → onUpdateMeta(patch)
18. Meta zapisane w stanie App.jsx → przelicza się kadraTab
19. Pola "Kontaktów alarmowych" pokazują wartości z meta
```

---

## Dodawanie nowego źródła telefonów

Aby dodać telefon dla nowego typu służby:

1. **Jeśli źródło to NFZ** — dodaj `kind` w backend `nfz-places`, rozszerz `benefit_keywords`
2. **Jeśli źródło to Overpass** — telefon już jest wyciągany z tagu `phone` (linia 78 geoportal.js)
3. **W `fetchAllGeoData`** — dodaj nowe `Promise.allSettled(...)`
4. **W `handleGeoFetch`** — dodaj `if (data.noweZrodlo?.[0]) { patch.xyz = ...; patch.xyz_tel = ... }`
5. **W Kadra tab** — dodaj `<Field>` z `value={meta.xyz_tel}`

---

## Uwagi

- NFZ API `/places` nie działa (400) — używamy `/queues`
- NFZ `/queues` zwraca ~40% wpisów z `latitude: null` — są odfiltrowywane
- `case=1` i `case=2` w NFZ NIE rozróżniają czysto szpitali od POZ — filtrujemy po `benefit`
- OSM (Overpass) ma telefony dla PSP i policji, ale rzadko dla szpitali — stąd merge z NFZ
- Backend proxy jest potrzebne, bo NFZ API nie wspiera CORS z przeglądarki
- `setup_server.sh` zawiera placeholder `DEEPSEEK_API_KEY` i `JINA_API_KEY` — trzeba uzupełnić przed deployem
