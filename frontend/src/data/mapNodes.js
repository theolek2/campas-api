/**
 * data/mapNodes.js — definicje węzłów mapy organizacji obozu.
 * Pozycje (x, y) w układzie współrzędnych SVG (viewBox 2000×3500).
 */

export const MAP_COORDS = {
  // ETAP 0
  '0.1': { x: 1000, y: 200 },

  // ETAP 1
  '1.1': { x: 1000, y: 480 },
  '1.2': { x: 1000, y: 570 },
  '1.3': { x: 1000, y: 660 },
  '1.4': { x: 1000, y: 750 },
  '1.5': { x: 1000, y: 840 },

  // ETAP 2 — ścieżki poboczne z lewej
  '2.1': { x: 440, y: 1020 },
  '2.2': { x: 320, y: 1140 },
  '2.3': { x: 440, y: 1260 },
  '2.4': { x: 320, y: 1380 },
  '2.5': { x: 440, y: 1500 },

  // ETAP 3 — PSP (główny)
  '3.1': { x: 1000, y: 1500 },

  // ETAP 4 — Kuratorium (główny)
  '4.1': { x: 1000, y: 1950 },

  // ETAP 4 poboczne (z prawej)
  '4.2': { x: 1560, y: 1900 },
  '4.3': { x: 1560, y: 2000 },

  // ETAP 5 — pozostałe (z prawej)
  '5.1': { x: 1560, y: 2240 },
  '5.2': { x: 1560, y: 2340 },
  '5.3': { x: 1560, y: 2440 },
  '5.4': { x: 1560, y: 2540 },
  '5.5': { x: 1560, y: 2640 },

  // ETAP 6 — finał
  '6.1': { x: 1000, y: 2900 },
  '6.2': { x: 1000, y: 3000 },
  '6.3': { x: 1000, y: 3100 },
  '6.4': { x: 1000, y: 3300 },
}

// Ścieżki między węzłami — format: [from_id, to_id]
export const PATHS = [
  // ETAP 0 → ETAP 1
  ['0.1', '1.1'],
  ['1.1', '1.2'], ['1.2', '1.3'], ['1.3', '1.4'], ['1.4', '1.5'],

  // ETAP 1 → ETAP 2 (lewe odgałęzienia)
  ['1.1', '2.1'],
  ['2.1', '2.2'], ['2.2', '2.3'], ['2.3', '2.4'], ['2.4', '2.5'],

  // ETAP 1 + 2 → ETAP 3 (PSP)
  ['1.5', '3.1'],
  ['2.5', '3.1'],

  // ETAP 3 → ETAP 4
  ['3.1', '4.1'],

  // ETAP 4 poboczne (prawe)
  ['4.1', '4.2'], ['4.2', '4.3'],

  // ETAP 4 → ETAP 5
  ['4.3', '5.1'],
  ['5.1', '5.2'], ['5.2', '5.3'], ['5.3', '5.4'], ['5.4', '5.5'],

  // ETAP 4 → ETAP 6
  ['4.1', '6.1'],
  ['6.1', '6.2'], ['6.2', '6.3'], ['6.3', '6.4'],

  // ETAP 5 → ETAP 6
  ['5.5', '6.3'],
]

// Etykiety wyświetlane na węźle (lub null — ukryte)
export const NODE_LABELS = {
  '0.1': 'Miejsce obozu',
  '1.1': 'Jednostka',
  '1.2': 'Kierownik',
  '1.3': 'Termin',
  '1.4': 'Uczestnicy',
  '1.5': 'Kadra',
  '2.1': 'Regulamin',
  '2.2': 'Instrukcja ppoż',
  '2.3': 'Mapa (zał. 3)',
  '2.4': 'Ewakuacja (zał. 4)',
  '2.5': 'Łączność (zał. 6)',
  '3.1': 'PSP — Opinia ppoż',
  '4.1': 'Kuratorium',
  '4.2': 'Karty kwalifikacyjne',
  '4.3': 'Lista uczestników',
  '5.1': 'Policja',
  '5.2': 'Szpital',
  '5.3': 'Latryny / doły chłonne',
  '5.4': 'Organizacja wody',
  '5.5': 'Wywóz śmieci',
  '6.1': 'Plan + jadłospis',
  '6.2': 'Budżet',
  '6.3': 'Ubezpieczenie',
  '6.4': 'OBÓZ GOTOWY',
}

// Ikony węzłów (emoji)
export const NODE_ICONS = {
  '0.1': '🌍',
  '1.1': '🏕️',
  '1.2': '👤',
  '1.3': '📅',
  '1.4': '👥',
  '1.5': '📋',
  '2.1': '📜',
  '2.2': '🔥',
  '2.3': '🗺️',
  '2.4': '🚪',
  '2.5': '📡',
  '3.1': '🚒',
  '4.1': '🏛️',
  '4.2': '🩺',
  '4.3': '📝',
  '5.1': '👮',
  '5.2': '🏥',
  '5.3': '🚽',
  '5.4': '💧',
  '5.5': '🗑️',
  '6.1': '📖',
  '6.2': '💰',
  '6.3': '🛡️',
  '6.4': '🏁',
}

// Graf szczegółów lokacji do wyświetlenia po "przybliżeniu"
// Mapowanie węzłów na obrazy szczegółów (importowane przez komponent)
export const NODE_DETAIL_IMAGE_KEY = {
  '1.x': 'detale-info',
  '2.x': 'detale-info',
  '3.1': 'detale-psp',
  '4.1': 'detale-kuratorium',
  '4.2': 'detale-kuratorium',
  '4.3': 'detale-kuratorium',
  '5.x': 'detale-ogolny',
  '6.x': 'detale-ogolny',
}

// Zależności — lista węzłów wymaganych do odblokowania danego węzła
export const DEPENDENCIES = {
  '3.1': ['1.1', '2.1', '2.2', '2.3', '2.4', '2.5'],
  '4.1': ['3.1'],
  // 6.4 jest auto — sprawdzane osobno
}

// Które węzły są automatycznie zaliczane na podstawie danych meta
export const AUTO_CHECK = {
  '0.1': (meta) => !!(meta.coords?.lat && meta.coords?.lng),
  '1.1': (meta) => !!meta.jednostka,
  '1.3': (meta) => !!(meta.date_start && meta.date_end),
  '1.4': (meta) => !!(meta.uczestnicy),
  '1.5': (meta) => Array.isArray(meta.wychowawcy) && meta.wychowawcy.length > 0,
}

// Węzeł startowy po pierwszym zaliczeniu ETAP 0
export const START_NODE = '1.1'

// Węzeł końcowy (finał)
export const FINAL_NODE = '6.4'

// Rozmiar ikony węzła
export const NODE_RADIUS = 32

// Kolory statusów
export const STATUS_COLORS = {
  locked: '#9ca3af',
  available: '#3b82f6',
  done: '#22c55e',
}

// Szerokość ścieżki
export const PATH_WIDTH = 4
