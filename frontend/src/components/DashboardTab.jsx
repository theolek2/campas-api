import { useMemo, useState, useEffect } from 'react'
import { INSTRUKCJA_PHASES, ALL_ITEMS, TOTAL_ITEMS } from '../data/instrukcja-items'
import { createTask, getTasks } from '../lib/api'
import TaskModal from './TaskModal'

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.ceil((d - today) / 86400000)
}

function countPhase(phase, checklist) {
  const ids = []
  if (phase.items) ids.push(...phase.items.map(i => i.id))
  if (phase.subs) phase.subs.forEach(s => s.items.forEach(i => ids.push(i.id)))
  const total = ids.length
  const done = ids.filter(id => checklist[id]).length
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color, size = 'md' }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2'
  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${h}`}>
      <div className={`${h} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── Countdown card ────────────────────────────────────────────────────────────
function CountdownCard({ label, days, urgent }) {
  if (days === null) return null
  const color = days < 0 ? '#ef4444' : days < 14 ? '#f97316' : days < 30 ? '#eab308' : '#22c55e'
  return (
    <div className="bg-white/20 rounded-xl px-4 py-3 text-center min-w-[120px]">
      <div className="text-3xl font-bold" style={{ color: days < 0 ? '#fca5a5' : 'white' }}>
        {days < 0 ? `+${Math.abs(days)}` : days}
      </div>
      <div className="text-xs text-green-100 mt-0.5">{days < 0 ? 'dni po terminie' : 'dni do'}</div>
      <div className="text-xs font-semibold text-white mt-0.5">{label}</div>
    </div>
  )
}

// ── Item row ──────────────────────────────────────────────────────────────────
function CheckItem({ item, checked, onToggle, onCreateTask, phaseColor, onNavigate, fileMap, tasks, onOpenTask }) {
  const handleNav = (e) => {
    e.stopPropagation()
    if (item.action === 'download' && item.pdf) {
      const entry = fileMap?.[item.pdf] || fileMap?.[item.pdf + '.txt']
      if (entry?.url) window.open(entry.url, '_blank')
      else if (item.tab) onNavigate(item.tab)
      else onNavigate('docs')
    } else if (item.tab) {
      onNavigate(item.tab)
    }
  }
  const canNav = item.tab || item.action === 'download'
  const existingTask = (tasks || []).find(t =>
    ((t.title || '').toLowerCase() === item.title.toLowerCase())
  )
  const taskExists = !!existingTask

  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 rounded-lg transition group ${
      checked ? 'bg-green-50' : 'hover:bg-gray-50'
    }`}>
      <button onClick={() => onToggle(item.id, !checked)}
        className={`w-5 h-5 rounded shrink-0 mt-0.5 border-2 flex items-center justify-center transition ${
          checked ? 'border-transparent text-white' : 'border-gray-300 hover:border-green-500'
        }`}
        style={checked ? { background: phaseColor } : {}}>
        {checked && <svg viewBox="0 0 10 8" className="w-3 h-3"><path fill="white" d="M1 4l3 3 5-6"/></svg>}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium flex items-center gap-1.5 ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.title}
          {item.star && <span className="text-yellow-500 text-xs">⭐</span>}
          {item.urgent && <span className="text-red-500 text-xs font-bold">❗</span>}
        </div>
        {item.desc && !checked && (
          <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.desc}</div>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          {canNav && !checked && (
            <button onClick={handleNav}
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                item.action === 'download'
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
              title={item.action === 'download' ? 'Pobierz PDF' : 'Przejdź do zakładki'}>
              {item.action === 'download' ? '📥 PDF' : '→ Otwórz'}
            </button>
          )}
          {taskExists && (
            <span className="text-[10px] text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Zadanie w Kanban
              {existingTask.assigned?.display_name && <span className="text-gray-400">· {existingTask.assigned.display_name}</span>}
              <span className="text-gray-400">· {existingTask.column === 'todo' ? 'Do zrobienia' : existingTask.column === 'in_progress' ? 'W trakcie' : 'Zrobione'}</span>
            </span>
          )}
        </div>
      </div>
        <button
          onClick={(e) => { e.stopPropagation(); taskExists ? onOpenTask(existingTask) : onCreateTask(item) }}
          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition shrink-0 ${
            taskExists
              ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
              : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-green-100 hover:text-green-600 hover:border-green-400'
          }`}
          title={taskExists ? 'Otwórz istniejące zadanie' : 'Utwórz zadanie w Kanban'}>
          {taskExists ? `📋 ${existingTask.column === 'done' ? 'Gotowe' : 'Otwórz'}` : '+⬜'}
        </button>
    </div>
  )
}

// ── Sub-section ───────────────────────────────────────────────────────────────
function SubSection({ sub, checklist, onToggle, onCreateTask, phaseColor, onNavigate, fileMap, tasks, onOpenTask }) {
  const [open, setOpen] = useState(false)
  const done = sub.items.filter(i => checklist[i.id]).length
  const total = sub.items.length
  const allDone = done === total

  return (
    <div className="mb-1">
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left transition text-xs font-semibold ${
          allDone ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-50'
        }`}>
        <span className="text-gray-400">{open ? '▼' : '▶'}</span>
        <span className={`flex-1 ${allDone ? 'line-through' : ''}`}>{sub.label}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
          allDone ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
        }`}>{done}/{total}</span>
      </button>
      {open && (
        <div className="ml-2">
          {sub.items.map(item => (
              <CheckItem key={item.id} item={item} checked={!!checklist[item.id]}
                onToggle={onToggle} onCreateTask={onCreateTask} phaseColor={phaseColor}
                onNavigate={onNavigate} fileMap={fileMap} tasks={tasks} onOpenTask={onOpenTask} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Phase accordion ───────────────────────────────────────────────────────────
function PhaseCard({ phase, checklist, onToggle, onCreateTask, onNavigate, fileMap, tasks, onOpenTask }) {
  const [open, setOpen] = useState(false)
  const { done, total, pct } = countPhase(phase, checklist)
  const allDone = done === total && total > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-3 shadow-sm">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition">
        <span className="text-xl shrink-0">{phase.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${allDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
              {phase.phase}
            </span>
            {phase.tab && (
              <button onClick={(e) => { e.stopPropagation(); onNavigate(phase.tab) }}
                className="text-green-600 hover:text-green-800 text-xs" title="Przejdź do zakładki">→</button>
            )}
            {phase.note && <span className="text-[10px] text-gray-400 hidden md:inline truncate">{phase.note}</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <ProgressBar pct={pct} color={allDone ? '#22c55e' : phase.color} size="sm" />
            <span className="text-xs text-gray-400 shrink-0 w-12 text-right">{done}/{total}</span>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
          allDone ? 'bg-green-100 text-green-700' : pct > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'
        }`}>{pct}%</span>
        <span className="text-gray-300 text-sm ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 pt-2 pb-3" style={{ background: phase.bg }}>
          {/* Flat items */}
          {phase.items?.map(item => (
            <CheckItem key={item.id} item={item} checked={!!checklist[item.id]}
              onToggle={onToggle} onCreateTask={onCreateTask} phaseColor={phase.color}
              onNavigate={onNavigate} fileMap={fileMap} tasks={tasks} onOpenTask={onOpenTask} />
          ))}
          {phase.subs?.map(sub => (
            <SubSection key={sub.sub} sub={sub} checklist={checklist}
              onToggle={onToggle} onCreateTask={onCreateTask} phaseColor={phase.color}
              onNavigate={onNavigate} fileMap={fileMap} tasks={tasks} onOpenTask={onOpenTask} />
          ))}
          {/* Sub-sections */}
          {phase.subs?.map(sub => (
            <SubSection key={sub.sub} sub={sub} checklist={checklist}
              onToggle={onToggle} onCreateTask={onCreateTask} phaseColor={phase.color}
              onNavigate={onNavigate} fileMap={fileMap} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardTab({ meta, days, user, onNavigate, checklist = {}, onChecklistUpdate }) {
  const [fileMap, setFileMap] = useState({})
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  useEffect(() => {
    import('../data/file-map.json').then(m => setFileMap(m.default || {})).catch(() => {})
    const campId = localStorage.getItem('campas_camp_id') || ''
    getTasks({ campId }).then(async (existing) => {
      setTasks(existing)
      // Auto-twórz taski dla itemów które nie istnieją
      if (existing.length < 10) {
        for (const item of ALL_ITEMS.slice(0, 30)) {
          const found = existing.find(t => (t.title || '').toLowerCase() === item.title.toLowerCase())
          if (!found) {
            try {
              const newT = await createTask(campId, {
                title: item.title,
                column: 'todo',
                priority: item.urgent ? 'urgent' : item.star ? 'high' : 'medium',
                notes: `instrukcja:${item.id}`,
                created_by: user?.id || '00000000-0000-0000-0000-000000000000',
              })
              if (newT) existing.push(newT)
            } catch {}
          }
        }
        // Po stworzeniu batchu — załaduj ponownie
        const all = await getTasks({ campId })
        setTasks(all)
      }
    }).catch(() => {})
  }, [])
  const daysToStart = daysUntil(meta.date_start)
  const daysToKuratorium = meta.date_start ? daysUntil(
    new Date(new Date(meta.date_start).getTime() - 21 * 86400000).toISOString().split('T')[0]
  ) : null

  const totalDone = useMemo(() => ALL_ITEMS.filter(i => checklist[i.id]).length, [checklist])
  const totalPct = Math.round((totalDone / TOTAL_ITEMS) * 100)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Dzień dobry'
    if (h < 18) return 'Cześć'
    return 'Dobry wieczór'
  })()

  const handleCreateTask = async (item) => {
    try {
      const data = await createTask({
        title: item.title,
        column: 'todo',
        priority: item.urgent ? 'urgent' : item.star ? 'high' : 'medium',
        notes: `instrukcja:${item.id}`,
        created_by: user?.id || '00000000-0000-0000-0000-000000000000',
      })
      // Dodaj do stanu lokalnego natychmiast
      setTasks(prev => [...prev, data])
      // Ot�j nowo stworzony task
      setSelectedTask(data)
    } catch (e) { console.warn('createTask:', e.message) }
  }

  const handleOpenTask = (task) => {
    setSelectedTask(task)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto p-5">

        {/* Hero */}
        <div className="bg-green-700 rounded-2xl p-6 text-white mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{greeting}, {meta.kierownik?.split(' ')[0] || 'Harcerzu'}! 👋</h1>
              <p className="text-green-200 text-sm mt-0.5">{meta.jednostka || 'Uzupełnij dane jednostki →'}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-5 flex-wrap">
            <CountdownCard label="obozu" days={daysToStart} />
            {daysToKuratorium !== null && (
              <CountdownCard label="wysyłki do kuratorium" days={daysToKuratorium} />
            )}
            {days.length > 0 && (
              <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
                <div className="text-3xl font-bold text-white">{days.length}</div>
                <div className="text-xs text-green-100 mt-0.5">dni obozu</div>
                <div className="text-xs font-semibold text-white mt-0.5">zaplanowanych</div>
              </div>
            )}
          </div>
        </div>

        {/* Globalny postęp */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-800">Postęp przygotowań</h2>
              <p className="text-xs text-gray-400 mt-0.5">{totalDone} z {TOTAL_ITEMS} punktów zaliczonych</p>
            </div>
            <span className="text-2xl font-bold" style={{ color: totalPct === 100 ? '#22c55e' : totalPct > 50 ? '#22c55e' : totalPct > 25 ? '#eab308' : '#6b7280' }}>
              {totalPct}%
            </span>
          </div>
          <ProgressBar pct={totalPct} color={totalPct === 100 ? '#22c55e' : '#16a34a'} />
        </div>

        {/* Checklista — 7 faz */}
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">
          📋 Instrukcja organizacji obozu <span className="text-gray-400 font-normal normal-case">v7.3.26</span>
        </h2>
        {INSTRUKCJA_PHASES.map(phase => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            checklist={checklist}
            onToggle={onChecklistUpdate}
            onCreateTask={handleCreateTask}
            onNavigate={onNavigate}
            fileMap={fileMap}
            tasks={tasks}
            onOpenTask={handleOpenTask}
          />
        ))}

        <p className="text-center text-xs text-gray-300 mt-4 mb-8">
          Kurs św. Marty i św. Józefa · Skauci Europy · wypoczynek@skauci-europy.pl
        </p>
      </div>
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => getTasks().then(setTasks)}
        />
      )}
    </div>
  )
}
