# Pulpit 2.0 — Interaktywna Mapa Obozu

## Cel

Graficzne przedstawienie procesu organizacji obozu harcerskiego jako animowanej, wertykalnej mapy z misjami do wykonania. Zastępuje dotychczasową checklistę procentową (`DashboardTab`). Docelowo trafi pod `/camp/{campId}/dashboard`.

## URL

`/camp/{campId}/dashboard2`

---

## Struktura danych

### Kolumna: `camps.map_state` (JSONB)

```json
{
  "nodes": {
    "0.1": "done",
    "1.1": "done",
    "1.2": "available",
    "2.1": "locked",
    "3.1": "locked"
  },
  "character_position": { "node_id": "1.1" },
  "visited_paths": ["0.1→1.1"]
}
```

### Statusy węzłów

| Status | Wygląd | Zachowanie |
|--------|--------|------------|
| `locked` | Szary, przygaszony | Nieklikalny — brak wymagań |
| `available` | Niebieski, pulsująca poświata | Klikalny — otwiera modal |
| `done` | Zielony + znacznik ✅ | Klikalny — otwiera modal (podgląd) |

---

## Drzewko etapów

```
                          ETAP 0 — LOKALIZACJA 🌍
                          └─ 0.1 Miejsce obozu
                             ⛔ BLOKADA: bez lokalizacji → globus zamiast mapy

                          ETAP 1 — DANE PODSTAWOWE 📋
      ┌──────────────────────├─ 1.1 Jednostka ⚠️ (wymagane)
      │                      ├─ 1.2 Kierownik (nieblokujące)
      │                      ├─ 1.3 Termin obozu
      │                      ├─ 1.4 Liczba uczestników
      │                      └─ 1.5 Kadra
      │
      │    ┌── 2.1 Regulamin obozu ──────────┐
      │    ├── 2.2 Instrukcja ppoż ──────────┤
      ├────┼── 2.3 Mapa zagospodarowania ────┤  ← ścieżki poboczne, zawsze dostępne
      │    ├── 2.4 Drogi ewakuacyjne ────────┤
      │    └── 2.5 Łączność + uczestnicy ────┘
      │                   │
      │    ETAP 3 — PSP 🔥 (główny, krytyczny)
      └────────→ 3.1 Wniosek o opinię ppoż
                 ◄── wymaga 1.1 + 2.1-2.5 ◆ 2-3 tygodnie

                          ETAP 4 — KURATORIUM 📋
       ┌──────────────────└─ 4.1 Zgłoszenie obozu
       │                     ◄── wymaga 3.1 ◆ deadline: 21 dni przed
       │              ┌── 4.2 Karty kwalifikacyjne ─┤ poboczne
       │              └── 4.3 Lista uczestników    ─┘
       │
       │    ┌── 5.1 Policja — zawiadomienie
       │    ├── 5.2 Szpital — zawiadomienie
       ├────┼── 5.3 Zgoda na latryny / doły chłonne
       │    ├── 5.4 Organizacja wody
       │    └── 5.5 Umowa na wywóz śmieci
       │
       │    ETAP 6 — FINAŁ 🏁
       └────────→ 6.1 Plan zajęć + jadłospis
                  ├─ 6.2 Budżet
                  ├─ 6.3 Ubezpieczenie / ZUS
                  └─ 6.4 ✅ OBÓZ GOTOWY (auto)
```

## Graf zależności

```
0 (miejsce)
  │
  ▼
1 (dane podst.) ──────────────────────┐
  │                                    │
  ├─→ 2.1-2.5 (dokumenty PSP, poboczne)
  │       │                            │
  ▼       ▼                            │
3 (PSP, wymaga 1+2)                    │
  │                                    │
  ▼                                    │
4 (Kuratorium, wymaga 3)               │
  ├─→ 4.2-4.3 (poboczne)               │
  │                                    │
  ├─→ 5.1-5.5 (poboczne) ─────────────┤
  │                                    │
  ▼                                    ▼
6 (finał) ◄────────────────────────────┘
  └─ 6.4 🏁
```

---

## Komponenty React

| Komponent | Odpowiedzialność |
|-----------|-----------------|
| `DashboardMap.jsx` | Kontener SVG: tło PNG, ścieżki, węzły, ludzik. Obsługuje zoom/pan (stały viewBox). |
| `MapNodeModal.jsx` | Modal otwierany po kliknięciu węzła. Zawiera mini-formularz lub link do podstrony. |
| `MapCharacter.jsx` | Ludzik: GIF idle (stoi na obecnym węźle), GIF walk (animacja przejścia). |
| `MapPath.jsx` | `<path>` SVG między węzłami. Animacja `stroke-dashoffset`. Kolor: szary (locked), niebieski (available), zielony (done). |
| `MapGlobe.jsx` | Widoczny gdy brak lokalizacji (ETAP 0). Animowana kula ziemska + przycisk. |
| `useMapState.js` | Hook: odczyt/zapis `map_state` z API, logika statusów, automatyczne wykrywanie `done`. |

---

## Logika automatycznego zaliczania węzłów

| Węzeł | Automatycznie `done` gdy... |
|-------|---------------------------|
| 0.1 | `meta.coords` niepuste (`lat` i `lng`) |
| 1.1 | `meta.jednostka` niepuste |
| 1.3 | `meta.date_start` i `meta.date_end` niepuste |
| 1.4 | `meta.uczestnicy` > 0 |
| 1.5 | `meta.wychowawcy` — tablica ma co najmniej 1 element |
| 6.4 | Wszystkie pozostałe węzły `done` |
| Pozostałe | Manualne (checkbox w modalu) |

---

## Zależności — co blokuje `available`

| Węzeł | Wymaga `done` |
|-------|--------------|
| 0.1 | — (zawsze available) |
| 1.x | 0.1 |
| 2.x | 0.1 (zawsze available) |
| 3.1 | 1.1 + 2.1-2.5 |
| 4.1 | 3.1 |
| 4.2, 4.3 | 0.1 (zawsze available) |
| 5.x | 0.1 (zawsze available) |
| 6.x | 0.1 (zawsze available) |

---

## Formularze w modalu

| Węzeł | Typ | Zawartość |
|-------|-----|-----------|
| 0.1 | Link | "Wybierz lokalizację" → `/camp/{id}/before/camp#teren` |
| 1.1 | Mini form | Input text — nazwa jednostki |
| 1.2 | Mini form | Input text — imię i nazwisko kierownika |
| 1.3 | Mini form | Input date × 2 — data start, data end |
| 1.4 | Mini form | Input number — liczba uczestników |
| 1.5 | Mini form | Lista pól: imię+nazwisko, funkcja, data niekaralności |
| 2.1 | Link | "Otwórz dokumenty" → `/camp/{id}/before/docs` |
| 2.2 | Checkbox | "Instrukcja gotowa" |
| 2.3 | Link | "Otwórz mapę" → `/camp/{id}/before/map` |
| 2.4 | Link | "Otwórz mapę" → `/camp/{id}/before/map` |
| 2.5 | Mini form | Input text — środki łączności |
| 3.1 | Checkbox + data | "Wniosek wysłany (data)", "Opinia otrzymana (data)" |
| 4.1 | Checkbox + licznik | "Zgłoszono (data)", "Zatwierdzono", licznik dni do deadline |
| 4.2 | Checkbox | "Karty zebrane — {0}/{uczestnicy}" |
| 4.3 | Checkbox | "Lista sporządzona" |
| 5.1-5.5 | Checkbox | Manualny checkbox |
| 6.1 | Link | "Plan zajęć" → `/camp/{id}/before/plan`, "Jadłospis" → `/camp/{id}/before/jadlospis` |
| 6.2 | Checkbox | "Budżet gotowy" |
| 6.3 | Checkbox | "Ubezpieczenie wykupione" |
| 6.4 | Automatyczny | Wyświetla się tylko gdy wszystkie `done` |

---

## Animacje

### 1. Ludzik
- **Idle**: GIF stojący, odtwarzany w pętli na obecnym węźle
- **Walk**: GIF chodzący, przesuwany `transform: translate()` wzdłuż ścieżki podczas przejścia między węzłami. Po dotarciu do celu wraca do idle.

### 2. Ścieżki
- **Nieodwiedzone**: `stroke-dasharray: 8 4`, kolor szary, nieanimowane
- **Odwiedzane**: `stroke-dashoffset` CSS transition 1s — efekt rysowania linii
- **Ukończone**: pełna linia, kolor zielony

### 3. Przybliżenie (zoom do lokacji)
- Mapa pokrywa się animowanymi chmurami (białe `<circle>` + `opacity` transition, 0.8s)
- Pod chmurami pojawia się grafika szczegółowa lokacji (remiza, polana, biuro)
- Chmury rozwiewają się (opacity → 0, scale down)
- Kliknięcie "Wróć" lub przycisku zamykającego — chmury wracają, odsłaniając mapę

---

## Grafiki (AI generated)

| Element | Opis | Status |
|---------|------|--------|
| Tło mapy | Wertykalna mapa skautowa, etapy od góry do dołu | Do wygenerowania |
| Ludzik idle | Skaut stojący, GIF | Do wygenerowania |
| Ludzik walk | Skaut idący, GIF | Do wygenerowania |
| Lokacja: remiza PSP | Budynek z wozem strażackim | Do wygenerowania |
| Lokacja: polana obozowa | Namioty, ognisko, flaga | Do wygenerowania |
| Lokacja: kuratorium | Budynek urzędu z flagą | Do wygenerowania |

### Prompt — tło mapy (wertykalne)

> A whimsical cartoon-style illustrated scout camp map in VERTICAL scroll layout, top-down isometric view. The landscape flows from TOP to BOTTOM through distinct zones connected by winding forest paths:
>
> **TOP — ETAP 0:** A globe floating above a forest canopy, with a telescope pointing at it. Below it, a wooden signpost "Wybierz miejsce" in a sunlit forest clearing.
>
> **UPPER-MIDDLE — ETAP 1:** A cluster of scout tents around a campfire with a Polish scout flag. A wooden notice board pinned with forms labelled "Dane". Clear space around for UI nodes.
>
> **LEFT SIDE (coming in from forest edge): ETAP 2 — Five small wooden signposts on a side trail:** Regulamin, Instrukcja PPOŻ, Mapa (zał.3), Ewakuacja (zał.4), Łączność (zał.6). These trail off to the left and converge on the fire station.
>
> **MIDDLE — ETAP 3:** A red-brick fire station building at the forest edge, with a small red fire truck outside. A wooden sign "PSP" above the door. This is the critical path node — all side trails converge here.
>
> **LOWER-MIDDLE — ETAP 4:** A classical Polish government building with white walls and red roof, Polish flag flying. A wooden sign "Kuratorium Oświaty". Two side trails leading in from the right labeled "Karty kwal." and "Lista uczestników".
>
> **RIGHT SIDE (side trails): ETAP 5 —** A police station with blue sign, a small hospital with red cross, a water tank, a garbage truck icon, and a wooden outhouse symbol. These trail in from the right, connecting between ETAP 4 and ETAP 6.
>
> **BOTTOM — ETAP 6:** A large celebratory scout camp with fully set up tents, campfire blazing, scouts gathered, a banner "OBÓZ GOTOWY" stretched between two trees.
>
> **STYLE:** Warm green color palette with earth tones. Clean vector-like illustration. Scout symbols: fleur-de-lis carved in trees, compass rose, scout scarf pattern. Whimsical but respectful of Polish scouting tradition. NO TEXT OR LABELS on the map (text will be added as UI overlay). 2000px wide × 3500px tall. Suitable for placing interactive markers on top.

### Prompt — ludzik idle (stojący)

> A cute cartoon boy scout character in full Polish scout uniform (green shirt, neckerchief with fleur-de-lis emblem, shorts, scout hat with Polish eagle), standing idle, gentle bobbing animation, cheerful expression. Side profile view, approximately 120px tall. Clean pixel-art friendly vector style, transparent background, isolated character sprite. Matching the whimsical illustrated map style.

### Prompt — ludzik walking (chodzący)

> Same Polish boy scout character in identical uniform, walking animation cycle, side profile view. 4-6 frames of smooth walk cycle with slight bounce, arms swinging naturally, neckerchief flowing gently. Transparent background, isolated sprite sheet ready for animation. Approximately 120px tall. Exactly matching the idle sprite in style, colors, and proportions.

### Prompt — lokacja: remiza PSP

> Close-up whimsical illustration of a Polish fire station at forest edge — red brick building with garage door slightly open, small red fire truck parked outside with Polish markings, trees framing both sides, a wooden sign "PSP" mounted by the entrance. Warm afternoon light filtering through trees. Same cartoon scout-map illustration style. 1200×800px.

### Prompt — lokacja: polana obozowa

> Close-up whimsical illustration of an active scout camp clearing — rows of green tents, campfire burning in center, scout flag on tall pole, wooden tables with maps and forms spread out, scouts in uniform sitting around. Warm sunlight through surrounding trees. Same cartoon scout-map illustration style. 1200×800px.

### Prompt — lokacja: kuratorium

> Close-up whimsical illustration of a Polish government education office (Kuratorium Oświaty) — classical architecture with white walls, red-tiled roof, Polish flag on a pole out front, grand wooden doors. A postman figure approaching with a large envelope. Same cartoon scout-map illustration style. 1200×800px.

---

## API

### GET `/api/camps/{campId}`
Zwraca pełny obóz z `map_state`. Frontend czyta `map_state` jako część odpowiedzi.

### PATCH `/api/camps/{campId}`
Przyjmuje `map_state` jako pole JSONB do aktualizacji.

```json
// Przykład — zapis stanu mapy
{
  "map_state": {
    "nodes": { "0.1": "done", "1.1": "available" },
    "character_position": { "node_id": "0.1" },
    "visited_paths": ["0.1→1.1"]
  }
}
```

---

## Uwagi

- Mapa jest w pełni zintegrowana z bazą — stan przetrwa F5, zmianę obozu, wylogowanie
- Misje poboczne (ETAP 2, 5) są zawsze dostępne — można je robić przed dotarciem do głównej ścieżki
- ETAP 0 bez lokalizacji = globus zamiast mapy + przycisk przekierowujący do zakładki "Teren"
- Negatywna opinia PSP = praktycznie nieobsługiwane (rzadkie) — użytkownik ręcznie zmienia miejsce obozu
