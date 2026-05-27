/**
 * api.js — warstwa danych campas.pl
 * Zastępuje supabase.js: wszystkie wywołania idą do własnego FastAPI.
 *
 * Token JWT:  localStorage.getItem('campas_token')
 * Dane usera: localStorage.getItem('campas_user')  (JSON)
 */

const BASE = ''  // same-origin: campas.pl/api → FastAPI

// ── Helpers ───────────────────────────────────────────────────────────────────

function _token() {
  return localStorage.getItem('campas_token') || ''
}

function _headers(json = true) {
  const h = { Authorization: `Bearer ${_token()}` }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

async function _json(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const d = await res.json(); msg = d.detail || JSON.stringify(d) } catch {}
    throw new Error(msg)
  }
  if (res.status === 204) return null
  return res.json()
}

function _qs(params) {
  const p = Object.entries(params || {}).filter(([, v]) => v != null)
  return p.length ? '?' + new URLSearchParams(p).toString() : ''
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Rejestracja nowego konta.
 * @returns {Promise<{token, user}|{message}>}
 */
export async function signUp(email, password, displayName = '', inviteToken = '') {
  try {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, display_name: displayName, invite_token: inviteToken || undefined }),
    })
    const data = await _json(res)
    if (data?.token) {
      localStorage.setItem('campas_token', data.token)
      localStorage.setItem('campas_user', JSON.stringify(data.user))
      return { data: { session: { access_token: data.token }, user: data.user, needs_verification: false }, error: null }
    }
    return { data: { session: null, user: null, needs_verification: true }, error: null }
  } catch (e) {
    return { data: null, error: e }
  }
}

/**
 * Logowanie — zwraca { token, user }.
 */
export async function signIn(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await _json(res)
  if (data?.token) {
    localStorage.setItem('campas_token', data.token)
    localStorage.setItem('campas_user', JSON.stringify(data.user))
  }
  return { data: { session: { access_token: data.token }, user: data.user }, error: null }
}

/**
 * Wylogowanie — czyści localStorage.
 */
export async function signOut() {
  localStorage.removeItem('campas_token')
  localStorage.removeItem('campas_user')
  localStorage.removeItem('campas_camp_id')
  return { error: null }
}

/**
 * Weryfikacja emaila — zwraca { token, user } lub rzuca błąd.
 */
export async function verifyEmail(token) {
  const res = await fetch(`${BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
  const data = await _json(res)
  if (data?.token) {
    localStorage.setItem('campas_token', data.token)
    localStorage.setItem('campas_user', JSON.stringify(data.user))
    return { data: { session: { access_token: data.token }, user: data.user }, error: null }
  }
  return { data: null, error: new Error('Weryfikacja nie powiodła się') }
}

/**
 * Magic login dla przybocznych — zwraca session_token + camp_id + user.
 */
export async function magicLogin(token) {
  const res = await fetch(`${BASE}/api/auth/magic-login?token=${encodeURIComponent(token)}`)
  return _json(res)
}

/**
 * Pobierz aktualną sesję (z localStorage).
 * Zwraca format kompatybilny z supabase.getSession().
 */
export async function getSession() {
  const token = _token()
  const userStr = localStorage.getItem('campas_user')
  if (!token || !userStr) return { data: { session: null } }
  try {
    const user = JSON.parse(userStr)
    return { data: { session: { access_token: token, user } } }
  } catch {
    return { data: { session: null } }
  }
}

/**
 * Pobierz zalogowanego usera (skrót).
 */
export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('campas_user') || 'null') }
  catch { return null }
}

// ── Profil ────────────────────────────────────────────────────────────────────

export async function getProfile(_userId) {
  // Dane usera przechowujemy lokalnie — zwracamy to co mamy w localStorage
  return getCurrentUser()
}

export async function upsertProfile(profile) {
  // Brak osobnej tabeli profiles — ignoruj lub prześlij do /api/auth/me gdy powstanie
  console.debug('[api] upsertProfile ignored (no endpoint yet)', profile)
}

// ── Camp meta / Checklista ────────────────────────────────────────────────────
// Przechowywane w localStorage (były w profiles.camp_meta w Supabase).
// Klucz: campas_meta_{camp_id}

export async function saveCampMeta(_userId, meta, campId) {
  const key = campId ? `campas_meta_${campId}` : 'campas_meta_default'
  localStorage.setItem(key, JSON.stringify(meta))
}

export async function loadCampMeta(_userId, campId) {
  const key = campId ? `campas_meta_${campId}` : 'campas_meta_default'
  try { return JSON.parse(localStorage.getItem(key) || 'null') }
  catch { return null }
}

export async function saveChecklist(_userId, checklist, campId) {
  const key = campId ? `campas_checklist_${campId}` : 'campas_checklist_default'
  localStorage.setItem(key, JSON.stringify(checklist))
}

export async function loadChecklist(_userId, campId) {
  const key = campId ? `campas_checklist_${campId}` : 'campas_checklist_default'
  try { return JSON.parse(localStorage.getItem(key) || '{}') }
  catch { return {} }
}

// ── Tereny ────────────────────────────────────────────────────────────────────

export async function getTerrains() {
  try {
    const res = await fetch(`${BASE}/api/terrains`, { headers: _headers() })
    return await _json(res)
  } catch (e) {
    console.warn('getTerrains:', e.message)
    return []
  }
}

export async function addTerrain(terrain) {
  try {
    const res = await fetch(`${BASE}/api/terrains`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify(terrain),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn('addTerrain failed (non-critical):', e.message)
    // Zwróć fake terrain żeby wizard mógł kontynuować
    return { id: null, name: terrain.name || 'obóz' }
  }
}

// ── Obozy ─────────────────────────────────────────────────────────────────────

export async function getCamps() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`${BASE}/api/camps`, { headers: _headers() })
    const camps = await _json(res)
    return {
      error: null,
      camps: (camps || []).map(c => ({
        ...c,
        status: c.date_end < today ? 'ended'
               : c.date_start <= today ? 'active'
               : 'planned',
      })),
    }
  } catch (e) {
    return { error: e.message, camps: [] }
  }
}

export async function getCampsForTerrain(terrainId) {
  const { camps } = await getCamps()
  return camps.filter(c => c.terrain_id === terrainId)
}

export async function addCamp(camp) {
  const { organizer_id: _, ...campData } = camp
  const res = await fetch(`${BASE}/api/camps`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify(campData),
  })
  return _json(res)
}

export async function updateCamp(id, patch) {
  const res = await fetch(`${BASE}/api/camps/${id}`, {
    method: 'PATCH',
    headers: _headers(),
    body: JSON.stringify(patch),
  })
  return _json(res)
}

// ── Składniki ─────────────────────────────────────────────────────────────────

export async function getAllIngredients() {
  try {
    const res = await fetch(`${BASE}/api/ingredients`, { headers: _headers() })
    return _json(res)
  } catch (e) {
    console.warn('getAllIngredients:', e.message)
    return []
  }
}

export async function addIngredient(name) {
  try {
    const res = await fetch(`${BASE}/api/ingredients`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ name }),
    })
    return _json(res)
  } catch (e) {
    console.warn('addIngredient:', e.message)
  }
}

export async function seedIngredients(names) {
  try {
    const res = await fetch(`${BASE}/api/ingredients/seed`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ names }),
    })
    return _json(res)
  } catch (e) {
    console.warn('seedIngredients:', e.message)
  }
}

// ── Użytkownicy zewnętrzni (przyboczni) ──────────────────────────────────────

export async function inviteExternalUser({ email, name, phone, role, invitedBy, campId }) {
  const res = await fetch(`${BASE}/api/camps/${campId}/team/invite`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ email, name, phone, role }),
  })
  return _json(res)
}

export async function getExternalUserByToken(token, campId) {
  // magic-login — zwraca {session_token, user}
  try {
    const res = await fetch(`${BASE}/api/camps/${campId}/team/magic-login?token=${token}`)
    return _json(res)
  } catch {
    return null
  }
}

export async function updateExternalUser(campId, id, patch) {
  const res = await fetch(`${BASE}/api/camps/${campId}/team/${id}`, {
    method: 'PATCH',
    headers: _headers(),
    body: JSON.stringify(patch),
  })
  return _json(res)
}

export async function getTeamMembers(campId) {
  const res = await fetch(`${BASE}/api/camps/${campId}/team`, { headers: _headers() })
  return _json(res)
}

// ── Zadania ───────────────────────────────────────────────────────────────────

export async function getTasks({ campId, assignedTo, column } = {}) {
  const qs = _qs({ assigned_to: assignedTo, column })
  try {
    const res = await fetch(`${BASE}/api/camps/${campId}/tasks${qs}`, { headers: _headers() })
    return _json(res)
  } catch (e) {
    console.warn('getTasks:', e.message)
    return []
  }
}

export async function createTask(campId, task) {
  const res = await fetch(`${BASE}/api/camps/${campId}/tasks`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify(task),
  })
  return _json(res)
}

export async function updateTask(campId, id, patch) {
  const res = await fetch(`${BASE}/api/camps/${campId}/tasks/${id}`, {
    method: 'PATCH',
    headers: _headers(),
    body: JSON.stringify(patch),
  })
  return _json(res)
}

export async function deleteTask(campId, id) {
  const res = await fetch(`${BASE}/api/camps/${campId}/tasks/${id}`, {
    method: 'DELETE',
    headers: _headers(),
  })
  return _json(res)
}

export async function toggleChecklistItem(campId, taskId, itemId, done, userId) {
  const res = await fetch(`${BASE}/api/camps/${campId}/tasks/${taskId}/checklist/${itemId}`, {
    method: 'PATCH',
    headers: _headers(),
    body: JSON.stringify({ done }),
  })
  return _json(res)
}

export async function addChecklistItem(campId, taskId, item) {
  const res = await fetch(`${BASE}/api/camps/${campId}/tasks/${taskId}/checklist`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify(item),
  })
  return _json(res)
}

export async function deleteChecklistItem(campId, taskId, itemId) {
  const res = await fetch(`${BASE}/api/camps/${campId}/tasks/${taskId}/checklist/${itemId}`, {
    method: 'DELETE',
    headers: _headers(),
  })
  return _json(res)
}

export async function addTaskComment(campId, taskId, comment) {
  const res = await fetch(`${BASE}/api/camps/${campId}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify(comment),
  })
  return _json(res)
}

export async function getTaskComments(campId, taskId) {
  const res = await fetch(`${BASE}/api/camps/${campId}/tasks/${taskId}/comments`, { headers: _headers() })
  return _json(res)
}

export async function deleteAllTasks(campId) {
  // Usuwa wszystkie taski — ostrożnie!
  const tasks = await getTasks({ campId })
  await Promise.all((tasks || []).map(t => deleteTask(campId, t.id)))
}

// ── Szablony zadań ────────────────────────────────────────────────────────────

export async function getDefaultTemplate(campId) {
  try {
    const res = await fetch(`${BASE}/api/camps/${campId}/tasks/templates`, { headers: _headers() })
    const templates = await _json(res)
    return (templates || []).find(t => t.is_default) || templates?.[0] || null
  } catch {
    return null
  }
}

export async function applyTemplate(campId, templateId) {
  const res = await fetch(`${BASE}/api/camps/${campId}/tasks/templates/apply`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ template_id: templateId }),
  })
  return _json(res)
}

// ── Activity log ──────────────────────────────────────────────────────────────

export async function logActivity(_action, _meta) {
  // Logowanie odbywa się po stronie serwera przy operacjach na taskach — nic tu nie robimy
}

export async function getActivityFeed(campId, limit = 30) {
  try {
    const res = await fetch(`${BASE}/api/camps/${campId}/tasks/activity?limit=${limit}`, { headers: _headers() })
    return _json(res)
  } catch {
    return []
  }
}

// ── Pliki ─────────────────────────────────────────────────────────────────────

export async function getSharedFiles(campId) {
  try {
    const res = await fetch(`${BASE}/api/camps/${campId}/files`, { headers: _headers() })
    return _json(res)
  } catch {
    return []
  }
}

/**
 * Upload pliku (multipart/form-data).
 * @param {string} campId
 * @param {File} file
 */
export async function uploadSharedFile(campId, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/api/camps/${campId}/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${_token()}` },  // bez Content-Type — fetch ustawi boundary
    body: form,
  })
  return _json(res)
}

export async function deleteSharedFile(campId, id) {
  const res = await fetch(`${BASE}/api/camps/${campId}/files/${id}`, {
    method: 'DELETE',
    headers: _headers(),
  })
  return _json(res)
}

/**
 * Zwraca URL do pobrania pliku.
 */
export function getFileDownloadUrl(campId, fileId) {
  return `${BASE}/api/camps/${campId}/files/dl/${fileId}?token=${_token()}`
}

// ── Kalendarz ─────────────────────────────────────────────────────────────────

export async function getCalendarEvents({ campId } = {}) {
  try {
    const res = await fetch(`${BASE}/api/camps/${campId}/calendar`, { headers: _headers() })
    return _json(res)
  } catch {
    return []
  }
}

export async function createCalendarEvent(campId, event) {
  const res = await fetch(`${BASE}/api/camps/${campId}/calendar`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify(event),
  })
  return _json(res)
}

export async function updateCalendarEvent(campId, id, patch) {
  const res = await fetch(`${BASE}/api/camps/${campId}/calendar/${id}`, {
    method: 'PATCH',
    headers: _headers(),
    body: JSON.stringify(patch),
  })
  return _json(res)
}

export async function deleteCalendarEvent(campId, id) {
  const res = await fetch(`${BASE}/api/camps/${campId}/calendar/${id}`, {
    method: 'DELETE',
    headers: _headers(),
  })
  return _json(res)
}

// ── Robert AI ─────────────────────────────────────────────────────────────────

export async function askRobert(question, history = []) {
  const res = await fetch(`${BASE}/api/robert`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ question, history }),
  })
  return _json(res)
}

// ── ULDK (GUGIK) ──────────────────────────────────────────────────────────────

export async function lookupParcel(lat, lng) {
  const res = await fetch(
    `${BASE}/api/uldk?request=GetParcelByXY&lat=${lat}&lng=${lng}`,
    { headers: _headers() },
  )
  if (!res.ok) throw new Error(`ULDK error ${res.status}`)
  return res.text()
}

// ── Eksport wsteczny (kompatybilność z komponentami używającymi supabase.js) ──

/** @deprecated Użyj signIn() — shim kompatybilności z supabase.js */
export const supabase = {
  auth: {
    signInWithPassword: ({ email, password }) => signIn(email, password),
    signOut,
    getSession,
    /**
     * Stub onAuthStateChange — w Supabase słuchał JWT refresh.
     * U nas token JWT jest statyczny (bez refresh), więc tylko jednorazowy callback przy mounie.
     * Zwraca { data: { subscription: { unsubscribe: fn } } } kompatybilny z Supabase SDK.
     */
    onAuthStateChange: (callback) => {
      // Odpal callback natychmiast z aktualnym stanem
      const token = _token()
      const userStr = localStorage.getItem('campas_user')
      const session = (token && userStr)
        ? { access_token: token, user: JSON.parse(userStr) }
        : null
      setTimeout(() => callback('INITIAL_SESSION', session), 0)
      return { data: { subscription: { unsubscribe: () => {} } } }
    },
  },
}

export default {
  signUp, signIn, signOut, verifyEmail, magicLogin, getSession, getCurrentUser,
  getProfile, upsertProfile,
  saveCampMeta, loadCampMeta, saveChecklist, loadChecklist,
  getTerrains, addTerrain,
  getCamps, getCampsForTerrain, addCamp, updateCamp,
  getAllIngredients, addIngredient, seedIngredients,
  inviteExternalUser, getExternalUserByToken, updateExternalUser, getTeamMembers,
  getTasks, createTask, updateTask, deleteTask,
  toggleChecklistItem, addChecklistItem, deleteChecklistItem,
  addTaskComment, getTaskComments, deleteAllTasks,
  getDefaultTemplate, applyTemplate,
  logActivity, getActivityFeed,
  getSharedFiles, uploadSharedFile, deleteSharedFile, getFileDownloadUrl,
  getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  askRobert, lookupParcel,
}
