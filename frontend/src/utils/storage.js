const BASE_KEY = 'skauting_v1'

function storageKey(campId) {
  return campId ? `${BASE_KEY}_${campId}` : BASE_KEY
}

export function saveState(state, campId) {
  try { localStorage.setItem(storageKey(campId), JSON.stringify(state)) } catch {}
}

export function loadState(campId) {
  try {
    const raw = localStorage.getItem(storageKey(campId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
