import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { AlertProvider } from './components/AlertContext'
import CampSwitcher from './components/CampSwitcher'
import JoinCampFlow from './components/JoinCampFlow'
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
import DashboardMap from './components/DashboardMap'
import FloatingRobert from './components/FloatingRobert'
import Confetti from './components/Confetti'
import { makeDay, DEFAULT_CAMP_ACTIVITIES } from './utils/defaults'
import { generatePdf } from './utils/generatePdf'
import { saveState, loadState } from './utils/storage'
import { supabase, signOut, getProfile, upsertProfile, saveCampData, loadCampData, saveChecklist, loadChecklist, getCamps, leaveCamp, deleteCamp, verifyEmail, magicLogin } from './lib/api'

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
  const [state, setState] = useState(() => {
    const savedCampId = localStorage.getItem('campas_camp_id')
    return loadState(savedCampId) || DEFAULT_STATE
  })
  const [user, setUser]               = useState(null)
  const [showAuth, setShowAuth]       = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skauting_progress') || '{}') } catch { return {} }
  })
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiOrigin, setConfettiOrigin] = useState(null)
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
  const [campId, setCampId] = useState(() => localStorage.getItem('campas_camp_id') || null)
  const [campsList, setCampsList] = useState([])
  const [showJoinFlow, setShowJoinFlow] = useState(() => window.location.pathname === '/dolacz')
  const [pendingJoinCode, setPendingJoinCode] = useState(null)

  const serverDataReadyRef = useRef(false)

  const prevUserIdRef = useRef(null)
  useEffect(() => {
    const uid = user?.id || null
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== uid) {
      setState(DEFAULT_STATE)
      setProgress({})
      setChecklist({})
    }
    prevUserIdRef.current = uid
  }, [user?.id])

  const [resetToken, setResetToken] = useState(null)
  const [resetError, setResetError] = useState('')

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

  const applyProfile = async (u) => {
    if (!u) return
    serverDataReadyRef.current = false
    try {
      await upsertProfile({ id: u.id, display_name: u.email?.split('@')[0] || '' })

      let activeCampId = campId
      try {
        const { camps } = await getCamps()
        if (camps?.length) {
          setCampsList(camps)
          if (!activeCampId || !camps.find(c => c.id === activeCampId)) {
            activeCampId = camps[0].id
            localStorage.setItem('campas_camp_id', activeCampId)
            setCampId(activeCampId)
          }
        }
      } catch {}

      const profile = await getProfile(u.id)
      const serverState = await loadCampData(activeCampId)

      const savedChecklist = serverState?.checklist
      if (savedChecklist && Object.keys(savedChecklist).length > 0) {
        setChecklist(savedChecklist)
        try { localStorage.setItem('skauting_checklist', JSON.stringify(savedChecklist)) } catch {}
      }

      if (serverState?.meta && Object.keys(serverState.meta).length > 0) {
        setState(s => ({ ...s, ...serverState, meta: { ...serverState.meta, email: serverState.meta.email || u.email || '' } }))
      } else if (serverState && !serverState.meta && Object.keys(serverState).length > 0) {
        update({ meta: { ...serverState, email: serverState.email || u.email || '' } })
      } else if (profile) {
        update({
          meta: {
            ...state.meta,
            email:         state.meta.email         || u.email || '',
            kierownik:     state.meta.kierownik     || profile.display_name || '',
            jednostka:     state.meta.jednostka     || profile.organization || '',
            tel_kierownik: state.meta.tel_kierownik || profile.phone        || '',
          }
        })
        if (!localStorage.getItem(`campas_onboarding_${u.id}`)) {
          setShowOnboarding(true)
        }
      }
    } catch {} finally {
      serverDataReadyRef.current = true
    }
  }

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

  const saveTimer = useRef(null)
  useEffect(() => {
    saveState(state, campId)
    // Zapisz pełny stan na serwer z debounce 2s (guard zapobiega nadpisaniu podczas ładowania)
    if (user?.id && serverDataReadyRef.current && campId) {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveCampData(campId, state).catch(() => {})
      }, 2000)
    }
  }, [state, campId])

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
  }, [state.meta.date_start, state.meta.date_end])

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
    setState(s => ({ ...s, meta: { ...s.meta, ...patch } }))
  }

  const addActivity = (name, description) =>
    update({ activities: [...activities, { id: `a_${Date.now()}`, name, description }] })
  const editActivity = (id, name, description) =>
    update({ activities: activities.map(a => a.id === id ? { ...a, name, description } : a) })
  const deleteActivity = (id) =>
    update({ activities: activities.filter(a => a.id !== id) })

  const addMealActivity = (name, description) =>
    update({ mealActivities: [...mealActivities, { id: `ma_${Date.now()}`, name, description }] })
  const editMealActivity = (id, name, description) =>
    update({ mealActivities: mealActivities.map(a => a.id === id ? { ...a, name, description } : a) })
  const deleteMealActivity = (id) =>
    update({ mealActivities: mealActivities.filter(a => a.id !== id) })

  const setDays = (n) => {
    const count = Math.max(1, Math.min(30, parseInt(n) || 0))
    if (!count) return
    const newDays = Array.from({ length: count }, (_, i) => {
      if (days[i]) return days[i]
      const day = makeDay(i)
      day.slots = template.map(s => ({ ...s, id: `slot_${Date.now()}_${Math.random()}` }))
      return day
    })
    update({ days: newDays })
    logActivity(`Ustawiono plan na ${count} ${count === 1 ? 'dzień' : 'dni'}`, '📋')
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

  if (!user && !externalUser) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center p-4"
          style={{ background: 'linear-gradient(160deg, #14532d 0%, #166534 40%, #15803d 100%)' }}>
          <div className="mb-8 text-center flex flex-col items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-14 w-14 object-contain" onError={e => { e.target.style.display = 'none' }} />
            <div>
              <h1 className="text-3xl font-bold text-white">CampAs</h1>
              <p className="text-green-300 mt-1 text-sm">Skauci Europy · System Obozowy</p>
            </div>
          </div>
          {resetError && <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-4 mb-4"><p className="text-red-600 text-sm text-center">{resetError}</p></div>}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col gap-3">
            <button onClick={() => setShowAuth(true)}
              className="w-full bg-green-700 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-800 transition">
              🔐 Zaloguj się
            </button>
            <button onClick={() => setShowJoinFlow(true)}
              className="w-full border-2 border-orange-300 text-orange-600 py-2.5 rounded-xl font-semibold hover:bg-orange-50 transition text-sm">
              🔑 Dołącz do obozu (mam kod)
            </button>
          </div>
        </div>
        {showAuth && (
          <AuthModal
            resetToken={resetToken}
            onClose={() => { setShowAuth(false); setResetToken(null) }}
              onAuth={u => {
              setUser(u)
              setShowAuth(false)
              applyProfile(u)
              if (pendingJoinCode) setShowJoinFlow(true)
            }}
          />
        )}
        {showJoinFlow && (
          <JoinCampFlow
            onClose={() => setShowJoinFlow(false)}
            onJoined={() => { window.location.href = '/camp/'; }}
          />
        )}
      </>
    )
  }

  return (
    <AlertProvider>
      <BrowserRouter basename="/camp">
        <AppRoutes
          user={user}
          externalUser={externalUser}
          state={state}
          update={update}
          updateMeta={updateMeta}
          progress={progress}
          toggleProgress={toggleProgress}
          checklist={checklist}
          updateChecklist={updateChecklist}
          logActivity={logActivity}
          campId={campId}
          setCampId={setCampId}
          campsList={campsList}
          setCampsList={setCampsList}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          showOnboarding={showOnboarding}
          setShowOnboarding={setShowOnboarding}
          showConfetti={showConfetti}
          setShowConfetti={setShowConfetti}
          confettiOrigin={confettiOrigin}
          showChangePwd={showChangePwd}
          setShowChangePwd={setShowChangePwd}
          showJoinFlow={showJoinFlow}
          setShowJoinFlow={setShowJoinFlow}
          pendingJoinCode={pendingJoinCode}
          setPendingJoinCode={setPendingJoinCode}
          handleExport={handleExport}
          setState={setState}
          addActivity={addActivity}
          editActivity={editActivity}
          deleteActivity={deleteActivity}
          addMealActivity={addMealActivity}
          editMealActivity={editMealActivity}
          deleteMealActivity={deleteMealActivity}
          setDays={setDays}
          updateDay={updateDay}
          deleteDay={deleteDay}
          addDay={addDay}
          logoutExternal={logoutExternal}
        />
      </BrowserRouter>
    </AlertProvider>
  )
}

function AppRoutes({
  user, externalUser, state, update, updateMeta,
  progress, toggleProgress, checklist, updateChecklist, logActivity,
  campId, setCampId, campsList, setCampsList,
  showMenu, setShowMenu, showOnboarding, setShowOnboarding,
  showConfetti, setShowConfetti, confettiOrigin,
  showChangePwd, setShowChangePwd, showJoinFlow, setShowJoinFlow,
  pendingJoinCode, setPendingJoinCode, handleExport, setState,
  addActivity, editActivity, deleteActivity,
  addMealActivity, editMealActivity, deleteMealActivity,
  setDays, updateDay, deleteDay, addDay,
  logoutExternal,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { campId: urlCampId } = useParams()

  const activeCampId = urlCampId || campId

  // Sync URL campId to parent state
  useEffect(() => {
    if (urlCampId && urlCampId !== campId && campsList.some(c => c.id === urlCampId)) {
      setCampId(urlCampId)
    }
  }, [urlCampId])

  const path = location.pathname
  // path format: /:campId/section/subtab  (basename /camp stripped by BrowserRouter)
  const pathSegs = path.split('/').filter(Boolean)
  const currentMain = pathSegs[1] && ['dashboard', 'before', 'during', 'tasks'].includes(pathSegs[1]) ? pathSegs[1] : ''
  const isBefore = currentMain === 'before'
  const isDuring = currentMain === 'during'
  const isTasks = currentMain === 'tasks'
  const currentTab = isBefore ? pathSegs[2] || 'camp' : null
  const currentDuringTab = isDuring ? pathSegs[2] || 'today' : null
  const currentTasksTab = isTasks ? pathSegs[2] || 'tasks' : null
  const duringDayParam = new URLSearchParams(location.search).get('day')
  const duringDayVal = duringDayParam ? parseInt(duringDayParam) : null

  const { meta, activities, days, template, activityLog, mealTemplate, mealActivities } = state

  const metaOk = meta.jednostka && meta.kierownik

  const go = (suffix) => navigate(`/${activeCampId}${suffix}`)

  const navigateToSection = (tab) => {
    const beforeTabs = ['camp','instructions','plan','jadlospis','diary','docs','map']
    if (beforeTabs.includes(tab)) { go('/before/' + tab); return }
    if (tab === 'during' || tab === 'during_today') { go('/during/today'); return }
    if (tab === 'during_calendar') { go('/during/calendar'); return }
    if (tab === 'during_shopping') { go('/during/shopping'); return }
    if (tab === 'tasks_section') { go('/tasks/tasks'); return }
    if (tab === 'dashboard') { go('/dashboard'); return }
    const map = {
      'Dane obozu':  'camp',
      'Plan zajęć':  'plan',
      'Dokumenty':   'docs',
      'Mapa terenu': 'map',
    }
    if (map[tab]) go('/before/' + map[tab])
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

  const DURING_TABS = [
    { id: 'today',    label: 'Dziś' },
    { id: 'calendar', label: 'Kalendarz' },
    { id: 'shopping', label: 'Zakupy' },
  ]

  const TASKS_TABS = [
    { id: 'tasks',    label: 'Tablica',   icon: '📋' },
    { id: 'calendar', label: 'Kalendarz', icon: '📅' },
    { id: 'files',    label: 'Pliki',     icon: '📁' },
    { id: 'team',     label: 'Zespół',    icon: '👥' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showOnboarding && (
        <div className="fixed inset-0 overflow-y-auto" style={{zIndex:2000}}>
          <OnboardingWizard
            meta={meta} userId={user?.id}
            updateMeta={(newMeta) => update({ meta: newMeta })}
            onDone={() => {
              setShowOnboarding(false)
              navigate(`/${activeCampId}/dashboard`)
              logActivity('Ukończono konfigurację obozu', '✅')
              if (user?.id) localStorage.setItem(`campas_onboarding_${user.id}`, '1')
            }}
          />
        </div>
      )}

      <header className="bg-green-800 text-white shadow sticky top-0 z-50">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-bold leading-tight">CampAs</h1>
              <p className="text-green-400 text-xs">Skauci Europy</p>
            </div>
            {campsList.length > 0 && !externalUser && (
              <CampSwitcher
                camps={campsList}
                currentCampId={campId}
                onSwitch={async (newId) => {
                  if (campId) saveState(state, campId)
                  localStorage.setItem('campas_camp_id', newId)
                  setCampId(newId)
                  const saved = loadState(newId)
                  if (saved && Object.keys(saved.meta || {}).some(k => saved.meta[k])) {
                    setState(saved)
                  } else {
                    try {
                      const savedMeta = await loadCampData(newId)
                      if (savedMeta && Object.keys(savedMeta).length > 0) {
                        setState(prev => ({ ...DEFAULT_STATE, meta: { ...(prev.meta || {}), ...(savedMeta.meta || savedMeta) } }))
                      } else {
                        setState(DEFAULT_STATE)
                      }
                    } catch { setState(DEFAULT_STATE) }
                  }
                  navigate(`/${newId}/dashboard`, { replace: true })
                }}
                onCreateNew={() => navigate(`/${activeCampId}/settings`)}
                onJoinCamp={() => setShowJoinFlow(true)}
                onLeaveCamp={async (leaveId, campName) => {
                  // Spróbuj najpierw opuścić (przyboczny)
                  if (!confirm(`Opuścić obóz "${campName}"?\nStracisz do niego dostęp.`)) return
                  try {
                    await leaveCamp(leaveId)
                    // Sukces — przyboczny opuścił
                    const updated = campsList.filter(c => c.id !== leaveId)
                    setCampsList(updated)
                    if (leaveId === campId && updated.length > 0) {
                      localStorage.setItem('campas_camp_id', updated[0].id)
                      setCampId(updated[0].id)
                      setState(DEFAULT_STATE)
                    }
                  } catch (e) {
                    // Jeśli właściciel próbuje opuścić — zaproponuj usunięcie obozu
                    if (e.message?.includes('właścicielem') || e.message?.includes('owner')) {
                      const confirmed = window.confirm(
                        `Jesteś właścicielem obozu "${campName}".\n\n` +
                        `Usunięcie obozu spowoduje:\n` +
                        `• Trwałe usunięcie wszystkich danych obozu\n` +
                        `• Utratę dostępu dla wszystkich przybocznych\n` +
                        `• Usunięcie planów zajęć, dokumentów i historii\n\n` +
                        `Tej operacji nie można cofnąć!\n\n` +
                        `Czy na pewno chcesz USUNĄĆ obóz "${campName}"?`
                      )
                      if (!confirmed) return
                      try {
                        await deleteCamp(leaveId)
                        const updated = campsList.filter(c => c.id !== leaveId)
                        setCampsList(updated)
                        if (leaveId === campId) {
                          localStorage.setItem('campas_camp_id', updated[0]?.id || '')
                          setCampId(updated[0]?.id || null)
                          setState(DEFAULT_STATE)
                        }
                      } catch (e2) { alert('Błąd usuwania obozu: ' + e2.message) }
                    } else {
                      alert('Błąd: ' + e.message)
                    }
                  }
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-300 text-xs hidden md:block">{
              externalUser ? externalUser.display_name || externalUser.email
              : user?.email?.split('@')[0]
            }</span>
            {externalUser && <span className="text-green-400 text-xs hidden md:block">(przyboczny)</span>}
            {path === `/${activeCampId}/before/plan` && !externalUser && (
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

        <div className="flex border-t border-green-700">
          {MAIN_SECTIONS.map(s => (
            <button key={s.id} onClick={() => go('/' + s.id + (s.id === 'before' ? '/camp' : s.id === 'during' ? '/today' : s.id === 'tasks' ? '/tasks' : ''))}
              className={`flex-1 py-2.5 text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                currentMain === s.id ? 'bg-white text-green-800' : 'text-green-300 hover:text-white hover:bg-green-700'
              }`}>
              <span className="text-base">{s.icon}</span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>

        {isBefore && (
          <div className="flex overflow-x-auto border-t border-green-700 bg-green-900">
            {BEFORE_TABS.map(t => (
              <button key={t.id} onClick={() => go('/before/' + t.id)}
                className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  currentTab === t.id ? 'bg-green-600 text-white' : 'text-green-400 hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {isDuring && (
          <div className="flex overflow-x-auto border-t border-green-700 bg-green-900">
            {DURING_TABS.map(t => (
              <button key={t.id} onClick={() => go('/during/' + t.id)}
                className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  currentDuringTab === t.id ? 'bg-green-600 text-white' : 'text-green-400 hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {isTasks && (
          <div className="flex overflow-x-auto border-t border-green-700 bg-green-900">
            {TASKS_TABS.map(t => (
              <button key={t.id} onClick={() => go('/tasks/' + t.id)}
                className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  currentTasksTab === t.id ? 'bg-green-600 text-white' : 'text-green-400 hover:text-white'
                }`}>
                <span className="mr-1">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {showMenu && (
        <div className="fixed inset-0 z-[2500] flex" onClick={() => setShowMenu(false)}>
          <div className="flex-1" onClick={() => setShowMenu(false)} />
          <div className="w-64 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="p-4 space-y-3">
              <button onClick={() => { navigate('/campsmap'); setShowMenu(false) }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left">
                <span className="text-2xl">🌍</span>
                <div>
                  <div className="font-semibold text-sm text-gray-800">Mapa obozów</div>
                  <div className="text-xs text-gray-400">Krajowa mapa Skautów Europy</div>
                </div>
              </button>
              <button onClick={() => { navigate('/robert'); setShowMenu(false) }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-semibold text-sm text-gray-800">Robert AI</div>
                  <div className="text-xs text-gray-400">Asystent skautowy</div>
                </div>
              </button>
              <hr />
              <a href="https://swi.campas.pl" target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition text-left no-underline"
                onClick={() => setShowMenu(false)}>
                <span className="text-2xl">🛒</span>
                <div>
                  <div className="font-semibold text-sm text-blue-700">SWI</div>
                  <div className="text-xs text-gray-400">System Wspomagania Intendentów</div>
                </div>
              </a>
              <hr />
              <button onClick={() => { navigate(`/${activeCampId}/settings`); setShowMenu(false) }}
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

      <Routes>
        <Route index element={<Navigate to={activeCampId ? `/${activeCampId}/dashboard` : '/camp'} replace />} />
        <Route path="/" element={<Navigate to={campsList[0]?.id ? `/${campsList[0].id}/dashboard` : '/camp'} replace />} />

        <Route path="/campsmap" element={<CampsMapTab user={user} meta={meta} />} />
        <Route path="/robert" element={
          <RobertTab onNavigate={(tab) => {
            const valid = ['camp','instructions','plan','jadlospis','diary','docs','map']
            if (valid.includes(tab)) go('/before/' + tab)
          }} />
        } />

        <Route path="/:campId/dashboard" element={
          <DashboardTab meta={meta} days={days} user={user}
            onNavigate={navigateToSection}
            activityLog={activityLog} checklist={checklist}
            onChecklistUpdate={updateChecklist} campId={activeCampId} />
        } />

        <Route path="/:campId/dashboard2" element={
          <DashboardMap meta={meta} campId={activeCampId}
            mapState={state.map_state}
            onStateChange={(ms) => update({ map_state: ms })} />
        } />

        <Route path="/:campId/before" element={<Navigate to={`${path}/camp`} replace />} />
        <Route path="/:campId/before/camp" element={
          <CampDataTab meta={meta} onUpdateMeta={updateMeta} userId={user?.id}
            progress={progress} onToggleProgress={toggleProgress} />
        } />
        <Route path="/:campId/before/instructions" element={<InstructionsTab />} />
        <Route path="/:campId/before/jadlospis" element={
          <div className="flex flex-1 overflow-hidden">
            <JadlospisTab meta={meta} days={days} mealTemplate={mealTemplate}
              mealActivities={mealActivities}
              onUpdate={update}
              onAddMealActivity={addMealActivity} onEditMealActivity={editMealActivity}
              onDeleteMealActivity={deleteMealActivity}
              progress={progress} onToggleProgress={toggleProgress} />
          </div>
        } />
        <Route path="/:campId/before/diary" element={
          <DiaryTab meta={meta} days={days} activities={activities}
            onNavigate={navigateToSection}
            onAddActivity={addActivity} onEditActivity={editActivity}
            onDeleteActivity={deleteActivity}
            progress={progress} onToggleProgress={toggleProgress} />
        } />
        <Route path="/:campId/before/docs" element={
          <DocumentsTab meta={meta} onNavigate={navigateToSection}
            progress={progress} onToggleProgress={toggleProgress} />
        } />
        <Route path="/:campId/before/map" element={
          <div className="flex flex-1 overflow-hidden"><MapTab user={user} meta={meta} /></div>
        } />
        <Route path="/:campId/before/plan" element={
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
              {!metaOk && (
                <div className="p-3 border-b border-gray-100">
                  <button onClick={() => go('/before/camp')}
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
                <ActivityPanel activities={activities} onAdd={addActivity}
                  onEdit={editActivity} onDelete={deleteActivity} />
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
                {meta.date_start && meta.date_end ? (
                  <>
                    <span className="text-sm font-semibold text-gray-700">Dni obozu:</span>
                    <span className="text-sm text-gray-500">od {meta.date_start} do {meta.date_end} — <b>{days.length}</b> dni</span>
                  </>
                ) : (
                  <span className="text-sm text-orange-600">⚠️ Ustaw daty obozu w zakładce „Dane obozu"</span>
                )}
                {meta.date_start && (
                  <button onClick={addDay}
                    className="ml-auto text-sm text-green-700 border border-green-400 px-3 py-1.5 rounded-lg hover:bg-green-50">
                    + Dodaj dzień
                  </button>
                )}
              </div>
              {days.length === 0 && (
                <div className="text-center py-24 text-gray-400">
                  <div className="text-5xl mb-4">⛺</div>
                  <p className="text-lg font-semibold">
                    {meta.date_start && meta.date_end ? 'Kliknij + Dodaj dzień, aby rozpocząć' : 'Ustaw daty obozu w zakładce „Dane obozu"'}
                  </p>
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
        } />

        <Route path="/:campId/during" element={<Navigate to={`${path}/today`} replace />} />
        <Route path="/:campId/during/today" element={
          <DuringCampTab meta={meta} days={days} view="today" selectedDay={duringDayVal} onNavigate={navigateToSection} />
        } />
        <Route path="/:campId/during/calendar" element={
          <DuringCampTab meta={meta} days={days} view="calendar" onNavigate={navigateToSection} />
        } />
        <Route path="/:campId/during/shopping" element={
          <DuringCampTab meta={meta} days={days} view="shopping" onNavigate={navigateToSection} />
        } />

        <Route path="/:campId/tasks" element={<Navigate to={`${path}/tasks`} replace />} />
        <Route path="/:campId/tasks/:subtab" element={
          <div className="flex-1 flex flex-col overflow-hidden">
            <ZadaniaTab user={user} meta={meta} campId={activeCampId} initialSubTab={currentTasksTab} />
          </div>
        } />

        <Route path="/:campId/settings" element={
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
        } />

        <Route path="*" element={<Navigate to={activeCampId ? `/${activeCampId}/dashboard` : '/camp'} replace />} />
      </Routes>

      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} origin={confettiOrigin} />
      <FloatingRobert hidden={(path === `/${activeCampId}/robert`) || (externalUser && !externalUser.robert_enabled) || !activeCampId} onNavigate={(tab) => {
        const valid = ['camp','instructions','plan','jadlospis','diary','docs','map']
        if (valid.includes(tab)) go('/before/' + tab)
      }} />

      {showChangePwd && (() => {
        const [pwd, setPwd] = useState('')
        const [oldPwd, setOldPwd] = useState('')
        const [msg, setMsg] = useState('')
        const [loading, setLoading] = useState(false)
        const handle = async () => {
          if (pwd.length < 10) return setMsg('Minimum 10 znaków')
          if (!/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/`~]/.test(pwd)) return setMsg('Wymagany znak specjalny')
          if (!/[A-Z]/.test(pwd)) return setMsg('Wymagana wielka litera')
          if (!/[a-z]/.test(pwd)) return setMsg('Wymagana mała litera')
          if (!/\d/.test(pwd)) return setMsg('Wymagana cyfra')
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

      {showJoinFlow && (
        <JoinCampFlow
          onClose={() => { setShowJoinFlow(false); setPendingJoinCode(null) }}
          onJoined={async (newCampId) => {
            setShowJoinFlow(false)
            setPendingJoinCode(null)
            localStorage.setItem('campas_camp_id', newCampId)
            setCampId(newCampId)
            try {
              const { camps } = await getCamps()
              if (camps?.length) setCampsList(camps)
            } catch {}
          }}
        />
      )}
    </div>
  )
}
