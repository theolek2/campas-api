import { useState, useEffect } from 'react'
import ActivityPanel from './components/ActivityPanel'
import DayCard from './components/DayCard'
import TemplatePanel from './components/TemplatePanel'
import MapTab from './components/MapTab'
import CampDataTab from './components/CampDataTab'
import CampsMapTab from './components/CampsMapTab'
import AuthModal from './components/AuthModal'
import OnboardingWizard from './components/OnboardingWizard'
import DashboardTab from './components/DashboardTab'
import DuringCampTab from './components/DuringCampTab'
import DiaryTab from './components/DiaryTab'
import DocumentsTab from './components/DocumentsTab'
import InstructionsTab from './components/InstructionsTab'
import JadlospisTab from './components/JadlospisTab'
import RobertTab from './components/RobertTab'
import ZadaniaTab from './components/ZadaniaTab'
import FloatingRobert from './components/FloatingRobert'
import Confetti from './components/Confetti'
import { makeDay, DEFAULT_CAMP_ACTIVITIES } from './utils/defaults'
import { generatePdf } from './utils/generatePdf'
import { saveState, loadState } from './utils/storage'
import { supabase, signOut, getProfile, upsertProfile, saveCampMeta, loadCampMeta, saveChecklist, loadChecklist, getCamps, verifyEmail, magicLogin } from './lib/api'

const DEFAULT_STATE = {
  meta: { jednostka: '', kierownik: '', miejsce: '', termin: '', date_start: '', date_end: '' },
  activities: DEFAULT_CAMP_ACTIVITIES.map(a => ({ ...a })),
  days: [],
  template: [],
  activityLog: [],
  mealTemplate: [],
  mealActivities: [],
}

export default function App() {
  const [state, setState] = useState(() => loadState() || DEFAULT_STATE)
  const [daysCount, setDaysCount] = useState('')
  // Główne sekcje: 'before' | 'during' | 'tasks' | 'settings'
  const [mainSection, setMainSection] = useState('dashboard')
  // Pod-zakładki w sekcji "Przed obozem"
  const [activeTab, setActiveTabMain] = useState('dashboard')
  const [user, setUser]               = useState(null)
  const [showAuth, setShowAuth]       = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skauting_progress') || '{}') } catch { return {} }
  })
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiOrigin, setConfettiOrigin] = useState(null)
  // Checklista Instrukcji — stan { 'UP.1': true, 'PR.1': false, ... }
  const [checklist, setChecklist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skauting_checklist') || '{}') } catch { return {} }
  })
  const [showMenu, setShowMenu] = useState(false)
  const [externalUser, setExternalUser] = useState(() => {
    try {
      const raw = localStorage.getItem('skauting_external_session')
      if (!raw) return null
      const sess = JSON.parse(raw)
      return sess?.user || null
    } catch { return null }
  })
  const [showChangePwd, setShowChangePwd] = useState(false)
  // campId — aktywny obóz (z localStorage, ładowany po logowaniu)
  const [campId, setCampId] = useState(() => localStorage.getItem('campas_camp_id') || null)
  // Stan dla linków z emaila
  const [resetToken, setResetToken] = useState(null)
  const [resetError, setResetError] = useState('')

  // Weryfikuj sesję przybocznego przy starcie (odśwież permisje)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('skauting_external_session')
      if (!raw) return
      const sess = JSON.parse(raw)
      if (!sess?.token || !sess?.camp_id) return
      fetch(`/api/camps/${sess.camp_id}/team/session?token=` + encodeURIComponent(sess.token))
        .then(r => r.json())
        .then(data => {
          if (data?.user) {
            setExternalUser(data.user)
            localStorage.setItem('skauting_external_session', JSON.stringify({
              token: sess.token,
              camp_id: sess.camp_id,
              user: data.user,
            }))
          } else {
            localStorage.removeItem('skauting_external_session')
            setExternalUser(null)
          }
        })
        .catch(() => {})
    } catch {}
  }, [])

  const logoutExternal = () => {
    localStorage.removeItem('skauting_external_session')
    setExternalUser(null)
  }

  const toggleProgress = (key, e) => {
    if (e?.currentTarget) {
      setConfettiOrigin(e.currentTarget.getBoundingClientRect())
    }
    setProgress(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('skauting_progress', JSON.stringify(next))
      if (!prev[key]) setShowConfetti(true)
      return next
    })
  }

  // Nawigacja z DashboardTab
  const navigateToSection = (tab) => {
    // Akceptuje bezpośrednie ID zakładek
    const tabs = ['camp','instructions','plan','jadlospis','diary','docs','map','tasks','calendar','files']
    if (tabs.includes(tab)) {
      setActiveTabMain(tab)
      setMainSection('before')
      return
    }
    // Sekcje główne (during, dashboard)
    if (tab === 'during') { setMainSection('during'); return }
    if (tab === 'tasks_section') { setMainSection('tasks'); return }
    if (tab === 'dashboard') { setMainSection('dashboard'); return }
    // Legacy: nazwy opisowe
    const map = {
      'Dane obozu':  'camp',
      'Plan zajęć':  'plan',
      'Dokumenty':   'docs',
      'Mapa terenu': 'map',
    }
    if (map[tab]) { setActiveTabMain(map[tab]); setMainSection('before') }
  }

  const goMainSection = (id) => {
    setMainSection(id)
    if (id === 'before') setActiveTabMain('camp')
  }

  // Po zalogowaniu — załaduj profil + campId + zapisane dane obozu
  const applyProfile = async (u) => {
    if (!u) return
    try {
      // Upewnij się że profil istnieje (FK constraint)
      await upsertProfile({ id: u.id, display_name: u.email?.split('@')[0] || '' })

      // Załaduj campId — użyj zapisanego lub pierwszego dostępnego obozu
      if (!campId) {
        try {
          const { camps } = await getCamps()
          if (camps?.length) {
            const firstCamp = camps[0]
            localStorage.setItem('campas_camp_id', firstCamp.id)
            setCampId(firstCamp.id)
          }
        } catch {}
      }

      const profile = await getProfile(u.id)
      const savedMeta = await loadCampMeta(u.id)

      // Wczytaj checklistę z Supabase
      const savedChecklist = savedMeta?.checklist
      if (savedChecklist && Object.keys(savedChecklist).length > 0) {
        setChecklist(savedChecklist)
        try { localStorage.setItem('skauting_checklist', JSON.stringify(savedChecklist)) } catch {}
      }

      if (savedMeta && Object.keys(savedMeta).length > 0) {
        // Przywróć pełne zapisane dane obozu
        update({ meta: { ...savedMeta, email: savedMeta.email || u.email || '' } })
      } else if (profile) {
        // Pierwsze logowanie — uzupełnij z profilu rejestracji
        update({
          meta: {
            ...state.meta,
            email:         state.meta.email         || u.email || '',
            kierownik:     state.meta.kierownik     || profile.display_name || '',
            jednostka:     state.meta.jednostka     || profile.organization || '',
            tel_kierownik: state.meta.tel_kierownik || profile.phone        || '',
          }
        })
      }
    } catch {}
  }

  // Supabase auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user || null
      setUser(u)
      if (u) applyProfile(u)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) applyProfile(u)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Obsługa linków z emaila (weryfikacja + reset hasła + magic link) ──────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verifyToken = params.get('verify')
    const resetToken = params.get('token')
    const magicToken = params.get('magic')

    if (magicToken) {
      magicLogin(magicToken).then(data => {
        if (data?.session_token) {
          localStorage.setItem('campas_camp_id', data.camp_id)
          localStorage.setItem('skauting_external_session', JSON.stringify({
            token: data.session_token,
            camp_id: data.camp_id,
            user: data.user,
          }))
          setExternalUser(data.user)
          window.history.replaceState({}, '', '/')
        } else {
          window.history.replaceState({}, '', '/login')
        }
      }).catch(() => {
        window.history.replaceState({}, '', '/login')
      })
      return
    }

    if (verifyToken) {
      verifyEmail(verifyToken).then(({ data, error }) => {
        if (data?.user) {
          setUser(data.user)
          window.history.replaceState({}, '', '/')
        } else {
          setResetError('Nieprawidłowy lub wygasły link weryfikacyjny. Spróbuj zalogować się ponownie.')
          window.history.replaceState({}, '', '/login')
        }
      }).catch(() => {
        setResetError('Nie udało się zweryfikować emaila. Spróbuj ponownie później.')
        window.history.replaceState({}, '', '/login')
      })
      return
    }

    if (resetToken) {
      setResetToken(resetToken)
      setShowAuth(true)
      return
    }
  }, [])

  const { meta, activities, days, template, activityLog = [], mealTemplate = [], mealActivities = [] } = state

  useEffect(() => { saveState(state) }, [state])

  // ── Auto-generowanie dni gdy zmienią się daty obozu ───────────────────────
  useEffect(() => {
    const { date_start, date_end } = state.meta
    if (!date_start || !date_end) return
    const start = new Date(date_start)
    const end = new Date(date_end)
    const n = Math.round((end - start) / 86400000) + 1
    if (n <= 0 || n > 35 || n === state.days.length) return

    const newDays = Array.from({ length: n }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i)
      return state.days[i] || makeDay(i)
    })
    const newMeals = Array.from({ length: n }, (_, i) =>
      state.mealTemplate[i] || { day: i + 1, slots: [] }
    )
    setState(s => ({ ...s, days: newDays, mealTemplate: newMeals }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.meta.date_start, state.meta.date_end])

  // ── Zapis/sync checklisty ──────────────────────────────────────────────────
  const updateChecklist = (itemId, checked) => {
    const next = { ...checklist, [itemId]: checked }
    setChecklist(next)
    try { localStorage.setItem('skauting_checklist', JSON.stringify(next)) } catch {}
    if (user?.id) saveChecklist(user.id, next).catch(() => {})
  }

  const update = (patch) => setState(s => ({ ...s, ...patch }))

  const logActivity = (action, icon = '📌') => {
    setState(s => ({
      ...s,
      activityLog: [
        { id: `al_${Date.now()}`, action, icon, time: new Date().toISOString() },
        ...(s.activityLog || []).slice(0, 19),
      ]
    }))
  }

  const updateMeta = (patch) => {
    const newMeta = { ...meta, ...patch }
    update({ meta: newMeta })
    // Zapisz do Supabase jeśli zalogowany
    if (user?.id) {
      saveCampMeta(user.id, newMeta).catch(() => {})
    }
  }

  // ── Zajęcia ──
  const addActivity = (name, description) =>
    update({ activities: [...activities, { id: `a_${Date.now()}`, name, description }] })
  const editActivity = (id, name, description) =>
    update({ activities: activities.map(a => a.id === id ? { ...a, name, description } : a) })
  const deleteActivity = (id) =>
    update({ activities: activities.filter(a => a.id !== id) })

  // ── Posiłki (jadłospis) ──
  const addMealActivity = (name, description) =>
    update({ mealActivities: [...mealActivities, { id: `ma_${Date.now()}`, name, description }] })
  const editMealActivity = (id, name, description) =>
    update({ mealActivities: mealActivities.map(a => a.id === id ? { ...a, name, description } : a) })
  const deleteMealActivity = (id) =>
    update({ mealActivities: mealActivities.filter(a => a.id !== id) })

  // ── Dni ──
  const setDays = (n) => {
    const count = Math.max(1, Math.min(30, parseInt(n) || 0))
    if (!count) return
    const newDays = Array.from({ length: count }, (_, i) => {
      if (days[i]) return days[i]
      // Nowy dzień: skopiuj sloty szablonu jako własne sloty (edytowalne)
      const day = makeDay(i)
      day.slots = template.map(s => ({ ...s, id: `slot_${Date.now()}_${Math.random()}` }))
      return day
    })
    update({ days: newDays })
    logActivity(`Ustawiono plan na ${count} ${count === 1 ? 'dzień' : 'dni'}`, '📋')
    setDaysCount('')
  }
  const updateDay = (id, updated) =>
    update({ days: days.map(d => d.id === id ? updated : d) })
  const deleteDay = (id) =>
    update({ days: days.filter(d => d.id !== id) })
  const addDay = () => {
    const day = makeDay(days.length)
    day.slots = template.map(s => ({ ...s, id: `slot_${Date.now()}_${Math.random()}` }))
    update({ days: [...days, day] })
    logActivity('Dodano nowy dzień do planu', '➕')
  }

  const handleExport = () => {
    if (!meta.jednostka || !meta.kierownik) {
      alert('Uzupełnij Jednostkę i Kierownika w lewym panelu przed eksportem.')
      return
    }
    generatePdf({ meta, days })
    logActivity('Wyeksportowano PDF — Ramowy Plan Pracy', '📄')
  }

  const metaOk = meta.jednostka && meta.kierownik

  // ── Bramka logowania — cała aplikacja za auth ──────────────────────────────
  if (!user && !externalUser) {
    return (
      <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Skauci Europy" className="h-20 mx-auto mb-4"
            onError={e => { e.currentTarget.style.display='none' }} />
          <h1 className="text-3xl font-bold text-white">CampAs</h1>
          <p className="text-green-300 mt-1">Skauci Europy · Asystent Obozowy</p>
        </div>
        {resetError && (
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-4 mb-4">
            <p className="text-red-600 text-sm text-center">{resetError}</p>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <p className="text-center text-gray-600 text-sm mb-6">
            Zaloguj się aby korzystać z aplikacji.<br/>
            <span className="text-xs text-gray-400">Dostęp tylko dla @skauci-europy.pl</span>
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="w-full bg-green-700 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-800 transition"
          >
            🔐 Zaloguj się
          </button>
        </div>
        {showAuth && (
          <AuthModal
            resetToken={resetToken}
            onClose={() => { setShowAuth(false); setResetToken(null); window.history.replaceState({}, '', '/login') }}
            onAuth={u => {
              setUser(u)
              setShowAuth(false)
              applyProfile(u)
              // Pokaż modal pierwszego logowania jeśli brak lokalizacji
              if (!state.meta.miejsce) setShowOnboarding(true)
            }}
          />
        )}
      </div>
    )
  }

  const MAIN_SECTIONS = [
    { id: 'dashboard', label: 'Pulpit',           icon: '🏠' },
    { id: 'before',   label: 'Przed obozem',     icon: '🏕️' },
    { id: 'during',   label: 'W trakcie obozu',  icon: '⛺' },
    { id: 'tasks',    label: 'Zadania',           icon: '📌' },
  ]

  const BEFORE_TABS = [
    { id: 'camp',        label: 'Dane obozu' },
    { id: 'instructions', label: 'Instrukcje' },
    { id: 'plan',        label: 'Plan zajęć' },
    { id: 'jadlospis',   label: 'Jadłospis' },
    { id: 'diary',       label: 'Dziennik zajęć' },
    { id: 'docs',        label: 'Dokumenty' },
    { id: 'map',         label: 'Mapa terenu' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Onboarding wizard */}
      {showOnboarding && (
        <div className="fixed inset-0 overflow-y-auto" style={{zIndex:2000}}>
          <OnboardingWizard
            meta={meta} userId={user?.id}
            updateMeta={(newMeta) => update({ meta: newMeta })}
            onDone={() => { setShowOnboarding(false); setMainSection('dashboard'); logActivity('Ukończono konfigurację obozu', '✅') }}
          />
        </div>
      )}

      {/* Header z nawigacją */}
      <header className="bg-green-800 text-white shadow shrink-0">
        {/* Top row */}
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Skauci Europy" className="h-8 w-auto object-contain"
              onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex' }} />
            <div className="hidden items-center justify-center w-8 h-8 bg-yellow-400 rounded-full text-green-900 font-black text-sm">⚜</div>
            <div>
              <h1 className="text-sm font-bold leading-tight">CampAs</h1>
              <p className="text-green-400 text-xs">Skauci Europy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-300 text-xs hidden md:block">{
              externalUser ? externalUser.display_name || externalUser.email
              : user?.email?.split('@')[0]
            }</span>
            {externalUser && <span className="text-green-400 text-xs hidden md:block">(przyboczny)</span>}
            {activeTab === 'plan' && mainSection === 'before' && !externalUser && (
              <button onClick={handleExport} disabled={!metaOk}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  metaOk ? 'bg-white text-green-800 hover:bg-green-50' : 'bg-green-700 text-green-400 cursor-not-allowed'
                }`}>
                📄 PDF
              </button>
            )}
            {externalUser && (
              <button onClick={() => setShowChangePwd(true)}
                className="text-xs text-green-400 hover:text-white px-2 py-1 rounded border border-green-700 hover:border-green-400 transition">
                🔒 Hasło
              </button>
            )}
            <button onClick={() => externalUser ? logoutExternal() : signOut()}
              className="text-xs text-green-400 hover:text-white px-2 py-1 rounded border border-green-700 hover:border-green-400 transition">
              Wyloguj
            </button>
            <button onClick={() => setShowMenu(o => !o)}
              className={`text-xl px-1.5 py-0.5 rounded transition ${showMenu ? 'bg-white text-green-800' : 'text-green-300 hover:text-white'}`}>
              ☰
            </button>
          </div>
        </div>

        {/* 4 główne sekcje */}
        <div className="flex border-t border-green-700">
          {MAIN_SECTIONS.map(s => (
            <button key={s.id} onClick={() => goMainSection(s.id)}
              className={`flex-1 py-2.5 text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                mainSection === s.id ? 'bg-white text-green-800' : 'text-green-300 hover:text-white hover:bg-green-700'
              }`}>
              <span className="text-base">{s.icon}</span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Sub-nawigacja — widoczna tylko w sekcji "Przed obozem" */}
        {mainSection === 'before' && (
          <div className="flex overflow-x-auto border-t border-green-700 bg-green-900">
            {BEFORE_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTabMain(t.id)}
                className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === t.id ? 'bg-green-600 text-white' : 'text-green-400 hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Hamburger menu panel */}
      {showMenu && (
        <div className="fixed inset-0 z-[2500] flex" onClick={() => setShowMenu(false)}>
          <div className="flex-1" onClick={() => setShowMenu(false)} />
          <div className="w-64 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="p-4 space-y-3">
              <button onClick={() => { setActiveTabMain('campsmap'); setMainSection('before'); setShowMenu(false) }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left">
                <span className="text-2xl">🌍</span>
                <div>
                  <div className="font-semibold text-sm text-gray-800">Mapa obozów</div>
                  <div className="text-xs text-gray-400">Krajowa mapa Skautów Europy</div>
                </div>
              </button>
              <button onClick={() => { setActiveTabMain('robert'); setMainSection('before'); setShowMenu(false) }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-semibold text-sm text-gray-800">Robert AI</div>
                  <div className="text-xs text-gray-400">Asystent skautowy</div>
                </div>
              </button>
              <hr />
              <button onClick={() => { setMainSection('settings'); setShowMenu(false) }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left">
                <span className="text-2xl">⚙️</span>
                <div>
                  <div className="font-semibold text-sm text-gray-800">Ustawienia</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Treść sekcji ── */}

      {/* PULPIT */}
      {mainSection === 'dashboard' && (
        <DashboardTab meta={meta} days={days} user={user} onNavigate={navigateToSection} activityLog={activityLog} checklist={checklist} onChecklistUpdate={updateChecklist} />
      )}

      {/* PRZED OBOZEM */}
      {mainSection === 'before' && (
        <>
          {activeTab === 'camp' && (
            <CampDataTab meta={meta} onUpdateMeta={updateMeta} userId={user?.id} progress={progress} onToggleProgress={toggleProgress} />
          )}
          {activeTab === 'instructions' && (
            <InstructionsTab />
          )}
          {activeTab === 'jadlospis' && (
            <div className="flex flex-1 overflow-hidden">
              <JadlospisTab meta={meta} days={days} mealTemplate={mealTemplate} mealActivities={mealActivities}
                onUpdate={update}
                onAddMealActivity={addMealActivity} onEditMealActivity={editMealActivity} onDeleteMealActivity={deleteMealActivity}
                progress={progress} onToggleProgress={toggleProgress} />
            </div>
          )}
          {activeTab === 'diary' && (
            <DiaryTab meta={meta} days={days} activities={activities} onNavigate={navigateToSection}
              onAddActivity={addActivity} onEditActivity={editActivity} onDeleteActivity={deleteActivity}
              progress={progress} onToggleProgress={toggleProgress} />
          )}
          {activeTab === 'docs' && (
            <DocumentsTab meta={meta} onNavigate={navigateToSection} progress={progress} onToggleProgress={toggleProgress} />
          )}
          {activeTab === 'map' && (
            <div className="flex flex-1 overflow-hidden"><MapTab user={user} meta={meta} /></div>
          )}
          {activeTab === 'campsmap' && (
            <CampsMapTab user={user} meta={meta} />
          )}
          {activeTab === 'robert' && (
            <RobertTab onNavigate={(tab) => {
              const valid = ['camp','instructions','plan','jadlospis','diary','docs','map']
              if (valid.includes(tab)) {
                setActiveTabMain(tab)
                setMainSection('before')
              }
            }} />
          )}
          {activeTab === 'plan' && (
            <div className="flex flex-1 overflow-hidden">
              <aside className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                {!metaOk && (
                  <div className="p-3 border-b border-gray-100">
                    <button onClick={() => setActiveTabMain('camp')}
                      className="w-full text-xs text-orange-600 border border-orange-200 bg-orange-50 rounded-lg py-2 hover:bg-orange-100 transition">
                      ⚠️ Uzupełnij dane obozu
                    </button>
                  </div>
                )}
                <div className="p-4 border-b border-gray-100">
                  <TemplatePanel
                    slots={template}
                    onChange={(newSlots) => {
                      const existingIds = new Set(template.map(s => s.id))
                      const added = newSlots.filter(s => !existingIds.has(s.id))
                      if (added.length > 0 && days.length > 0) {
                        update({ template: newSlots, days: days.map(day => ({
                          ...day,
                          slots: [...day.slots, ...added.map(s => ({ ...s, id: `slot_${Date.now()}_${Math.random()}` }))]
                        })) })
                      } else { update({ template: newSlots }) }
                    }}
                    activities={activities}
                  />
                </div>
                <div className="p-4 flex-1">
                  <ActivityPanel activities={activities} onAdd={addActivity} onEdit={editActivity} onDelete={deleteActivity} />
                </div>
              </aside>
              <main className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-800">📋 Plan zajęć</h2>
                  <button onClick={(e) => toggleProgress('plan', e)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                      progress?.plan ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-300 hover:border-green-400'
                    }`}>
                    {progress?.plan ? '✅' : '⬜'} Zrobione
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <span className="text-sm font-semibold text-gray-700">Liczba dni obozu:</span>
                  <input type="number" min={1} max={30}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
                    placeholder="np. 10" value={daysCount}
                    onChange={e => setDaysCount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setDays(daysCount)} />
                  <button onClick={() => setDays(daysCount)}
                    className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-800">
                    Ustaw
                  </button>
                  {days.length > 0 && <span className="text-sm text-gray-500">Zaplanowane: <b>{days.length}</b> dni</span>}
                  <button onClick={addDay}
                    className="ml-auto text-sm text-green-700 border border-green-400 px-3 py-1.5 rounded-lg hover:bg-green-50">
                    + Dodaj dzień
                  </button>
                </div>
                {days.length === 0 && (
                  <div className="text-center py-24 text-gray-400">
                    <div className="text-5xl mb-4">⛺</div>
                    <p className="text-lg font-semibold">Wpisz liczbę dni i kliknij „Ustaw"</p>
                  </div>
                )}
                {days.map((day, i) => (
                  <DayCard key={day.id} day={day} index={i} activities={activities}
                    onChange={updated => updateDay(day.id, updated)}
                    onDelete={() => deleteDay(day.id)} />
                ))}
                {days.length > 0 && (
                  <button onClick={handleExport} disabled={!metaOk}
                    className={`w-full mt-2 py-3 rounded-xl font-bold text-base transition shadow ${
                      metaOk ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}>
                    📄 Eksportuj PDF — Ramowy Plan Pracy
                  </button>
                )}
              </main>
            </div>
          )}
        </>
      )}

      {/* W TRAKCIE OBOZU */}
      {mainSection === 'during' && (
        <DuringCampTab meta={meta} days={days} />
      )}

      {/* ZADANIA */}
      {mainSection === 'tasks' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ZadaniaTab user={user} meta={meta} campId={campId} />
        </div>
      )}

      {/* USTAWIENIA */}
      {mainSection === 'settings' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ustawienia</h2>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</div>
              <div className="font-medium">{user?.email}</div>
            </div>
            <hr />
            <button onClick={() => signOut()}
              className="w-full text-left text-red-500 hover:text-red-700 text-sm font-semibold py-2">
              🚪 Wyloguj się
            </button>
          </div>
        </div>
      )}
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} origin={confettiOrigin} />
      <FloatingRobert hidden={(mainSection === 'before' && activeTab === 'robert') || (externalUser && !externalUser.robert_enabled)} onNavigate={(tab) => {
        const valid = ['camp','instructions','plan','jadlospis','diary','docs','map']
        if (valid.includes(tab)) { setActiveTabMain(tab); setMainSection('before') }
      }} />

      {showChangePwd && (() => {
        const [pwd, setPwd] = useState('')
        const [oldPwd, setOldPwd] = useState('')
        const [msg, setMsg] = useState('')
        const [loading, setLoading] = useState(false)
        const handle = async () => {
          if (pwd.length < 10) return setMsg('Minimum 10 znaków')
          if (!/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/`~]/.test(pwd)) return setMsg('Wymagany znak specjalny')
          setLoading(true)
          try {
            const sess = JSON.parse(localStorage.getItem('skauting_external_session'))
            const res = await fetch(`/api/camps/${sess.camp_id}/team/change-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionToken: sess?.token, oldPassword: oldPwd, newPassword: pwd }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || data.error)
            setMsg('✅ Hasło zmienione!')
            setTimeout(() => setShowChangePwd(false), 1000)
          } catch (e) { setMsg(e.message) }
          finally { setLoading(false) }
        }
        return (
          <div className="fixed inset-0 bg-black/40 z-[3000] flex items-center justify-center p-4" onClick={() => setShowChangePwd(false)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-gray-800 mb-3">🔒 Zmiana hasła</h3>
              <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-green-500"
                placeholder="Obecne hasło" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
              <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-500"
                placeholder="Nowe hasło (min 10 znaków, znak specjalny)" value={pwd} onChange={e => setPwd(e.target.value)} />
              {msg && <p className={`text-xs mb-2 ${msg.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowChangePwd(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Anuluj</button>
                <button onClick={handle} disabled={loading} className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-bold hover:bg-green-800 disabled:opacity-50">
                  {loading ? 'Zmieniam...' : 'Zmień hasło'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
