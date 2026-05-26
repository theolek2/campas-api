const KEY = 'skauting_v1'

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
