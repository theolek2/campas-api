import { useState, useEffect, useCallback } from 'react'
import { getTasks, createTask, updateTask, deleteTask, deleteAllTasks, logActivity, getActivityFeed, getDefaultTemplate, getTeamMembers } from '../lib/api'
import TaskModal from './TaskModal'
import Confetti from './Confetti'

const COLUMNS = [
  { id: 'todo',       label: 'Do zrobienia',  color: 'bg-gray-100',    dot: '⚪' },
  { id: 'in_progress', label: 'W trakcie',    color: 'bg-blue-50',    dot: '🔵' },
  { id: 'done',       label: 'Zrobione',      color: 'bg-green-50',   dot: '🟢' },
  { id: 'archived',   label: 'Archiwum',       color: 'bg-gray-200/50', dot: '📦' },
]

const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#6b7280' }
const PRIORITY_LABELS = { urgent: 'Pilne', high: 'Wysoki', medium: 'Średni', low: 'Niski' }

const NEXT_COLUMN = { todo: 'in_progress', in_progress: 'done' }

function TaskCard({ task, onClick, members, onUpdate, onComplete }) {
  const [hovered, setHovered] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  const deadline = task.deadline ? new Date(task.deadline) : null
  const isOverdue = deadline && deadline < new Date() && task.column !== 'done' && task.column !== 'archived'
  const checklists = task.checklists || []
  const doneCount = checklists.filter(c => c.done).length
  const nextCol = NEXT_COLUMN[task.column]

  const assignee = task.assigned?.display_name || task.assigned?.email || null
  const initials = assignee ? assignee.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : null

  const handleQuickAssign = async (e, memberId) => {
    e.stopPropagation()
    const campId = localStorage.getItem('campas_camp_id') || ''
    await updateTask(campId, task.id, { assigned_to: memberId || null })
    setShowAssign(false)
    onUpdate?.()
  }

  const handleQuickMove = async (e) => {
    e.stopPropagation()
    const campId = localStorage.getItem('campas_camp_id') || ''
    await updateTask(campId, task.id, { column: nextCol })
    if (nextCol === 'done') onComplete?.(e)
    onUpdate?.()
  }

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.setData('fromColumn', task.column) }}
      onClick={() => onClick(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowAssign(false) }}
      className="relative bg-white border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer hover:shadow-md hover:border-green-400 transition mb-2 text-sm overflow-visible"
      style={{ borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || '#e5e7eb'}` }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800 truncate pr-6">{task.title}</div>
          {task.description && <div className="text-xs text-gray-400 truncate mt-0.5">{task.description}</div>}
        </div>
        {/* Quick move arrow */}
        {hovered && nextCol && (
          <button onClick={handleQuickMove}
            className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-xs hover:bg-green-200 transition shrink-0"
            title={`Przesuń do: ${nextCol === 'in_progress' ? 'W trakcie' : 'Zrobione'}`}>
            →
          </button>
        )}
      </div>

      {/* Pasek postępu subtasków */}
      {checklists.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.round((doneCount / checklists.length) * 100)}%` }} />
            </div>
            <span className="text-[10px] text-gray-400">{doneCount}/{checklists.length}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
        {deadline && (
          <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
            📅 {deadline.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
            {isOverdue && ' ⚠'}
          </span>
        )}
        <div className="ml-auto relative">
          {/* Quick assign button */}
          <button
            onClick={e => { e.stopPropagation(); setShowAssign(v => !v) }}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition text-[10px] ${
              assignee ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {initials ? (
              <span className="w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center text-[9px] font-bold">{initials}</span>
            ) : (
              <span>+ Przypisz</span>
            )}
            {assignee && <span className="max-w-[80px] truncate">{assignee}</span>}
            <span>▾</span>
          </button>

          {/* Dropdown */}
          {showAssign && (
            <div className="absolute bottom-full right-0 mb-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 min-w-[160px] py-1"
              onClick={e => e.stopPropagation()}>
              <button onClick={e => handleQuickAssign(e, null)}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
                — Brak przypisania
              </button>
              {members.map(m => (
                <button key={m.id} onClick={e => handleQuickAssign(e, m.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-green-50 hover:text-green-800 ${
                    task.assigned?.id === m.id ? 'bg-green-50 text-green-800 font-semibold' : 'text-gray-700'
                  }`}>
                  {m.display_name || m.email}
                </button>
              ))}
              {members.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400">Brak członków zespołu</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InviteModal({ onClose, onInvited }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [guestLogin, setGuestLogin] = useState(null)

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const campId = localStorage.getItem('campas_camp_id') || ''
      const _tok = localStorage.getItem('campas_token') || ''
      if (!campId) throw new Error('Brak wybranego obozu')
      const res = await fetch(`/api/camps/${campId}/team/create-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_tok}` },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || 'Błąd')
      setGuestLogin({ email: data.email, password: data.password })
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[2000] flex items-center justify-center p-4">
      {guestLogin ? (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-bold text-gray-800 mb-2">Konto utworzone!</h3>
          <p className="text-xs text-gray-500 mb-3">Przekaż dane logowania przybocznemu</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-sm text-left space-y-1.5">
            <div><b className="text-gray-500">Email:</b> <span className="text-gray-800 select-all">{guestLogin.email}</span></div>
            <div><b className="text-gray-500">Hasło:</b> <span className="text-green-700 font-mono font-bold select-all">{guestLogin.password}</span></div>
            <div className="text-xs text-gray-400 pt-1 border-t border-gray-200">Przyboczny loguje się tym hasłem, potem może je zmienić</div>
          </div>
          <button onClick={() => { onInvited(); onClose() }}
            className="w-full bg-green-700 text-white rounded-lg py-2 text-sm font-bold hover:bg-green-800 transition">
            OK, zamknij
          </button>
        </div>
      ) : (
        <form onSubmit={handle} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          <h3 className="font-bold text-gray-800 mb-4">📨 Zaproś przybocznego</h3>
          <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-500"
            placeholder="Imię i nazwisko" value={name} onChange={e => setName(e.target.value)} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-500"
            type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          {err && <p className="text-red-500 text-xs mb-2">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Anuluj</button>
            <button type="submit" disabled={loading} className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-bold hover:bg-green-800 disabled:opacity-50">
              {loading ? 'Tworzę...' : 'Utwórz konto'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function TasksTab({ user, meta }) {
  const [tasks, setTasks] = useState([])
  const [feed, setFeed] = useState([])
  const [filterPerson, setFilterPerson] = useState('')
  const [filterDeadline, setFilterDeadline] = useState('') // 'overdue'|'today'|'week'|'month'|''
  const [showInvite, setShowInvite] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [addingCol, setAddingCol] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [members, setMembers] = useState([])
  const [filterPriority, setFilterPriority] = useState('')
  const [confetti, setConfetti] = useState(false)
  const [confettiOrigin, setConfettiOrigin] = useState(null)

  const load = useCallback(async () => {
    const campId = localStorage.getItem('campas_camp_id') || ''
    if (!campId) return
    const t = await getTasks({ campId })
    setTasks(t)
    const f = await getActivityFeed(campId, 20)
    setFeed(f)
    try {
      const all = await getTeamMembers(campId)
      setMembers((all || []).filter(m => m.active))
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  const fireConfetti = (e) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.() || { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 }
    setConfettiOrigin(rect)
    setConfetti(true)
  }

  const handleDrop = async (e, toColumn) => {
    e.preventDefault()
    const campId = localStorage.getItem('campas_camp_id') || ''
    const taskId = e.dataTransfer.getData('taskId')
    const fromColumn = e.dataTransfer.getData('fromColumn')
    if (fromColumn === toColumn) return
    await updateTask(campId, taskId, { column: toColumn })
    if (toColumn === 'done') fireConfetti(e)
    load()
  }

  const handleAddTask = async () => {
    const campId = localStorage.getItem('campas_camp_id') || ''
    const title = newTitle.trim()
    if (!title || !campId) return
    await createTask(campId, {
      title,
      column: addingCol,
      created_by: user?.id,
      assigned_to: newAssignee || null,
    })
    setNewTitle('')
    setNewAssignee('')
    setAddingCol(null)
    load()
  }

  const handleLoadTemplate = async () => {
    const campId = localStorage.getItem('campas_camp_id') || ''
    if (!campId) return
    const tmpl = await getDefaultTemplate(campId)
    if (!tmpl?.tasks) return alert('Brak szablonu')
    if (tasks.length > 0) {
      const ok = window.confirm(`Masz już ${tasks.length} zadań. Usunąć wszystkie i załadować szablon od nowa?`)
      if (!ok) return
      await deleteAllTasks(campId)
    }
    for (const t of tmpl.tasks) {
      await createTask(campId, { ...t, column: 'todo', created_by: user?.id })
    }
    load()
  }

  const handleResetTasks = async () => {
    const campId = localStorage.getItem('campas_camp_id') || ''
    if (!window.confirm(`Usunąć WSZYSTKIE ${tasks.length} zadań? Tej akcji nie można cofnąć.`)) return
    await deleteAllTasks(campId)
    load()
  }

  // Wszyscy członkowie: właściciel konta + external_users
  const allMembers = [
    ...(user ? [{ id: user.id, display_name: meta?.kierownik || user.email?.split('@')[0] || 'Ja (kierownik)', isOwner: true }] : []),
    ...members,
  ]

  // Filtrowanie
  const today = new Date(); today.setHours(0,0,0,0)
  const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  let filtered = tasks
  if (filterPerson) {
    filtered = filtered.filter(t => t.assigned?.id === filterPerson)
  }
  if (filterDeadline === 'overdue') {
    filtered = filtered.filter(t => t.deadline && new Date(t.deadline) < today && t.column !== 'done' && t.column !== 'archived')
  } else if (filterDeadline === 'today') {
    filtered = filtered.filter(t => { const d = t.deadline && new Date(t.deadline); d?.setHours(0,0,0,0); return d?.getTime() === today.getTime() })
  } else if (filterDeadline === 'week') {
    filtered = filtered.filter(t => t.deadline && new Date(t.deadline) <= endOfWeek)
  } else if (filterDeadline === 'month') {
    filtered = filtered.filter(t => t.deadline && new Date(t.deadline) <= endOfMonth)
  }
  if (filterPriority) {
    filtered = filtered.filter(t => t.priority === filterPriority)
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
      {/* Pasek narzędzi */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0">
        <h2 className="font-bold text-gray-800 text-sm shrink-0">📋 Zadania</h2>

        {/* Filtr osoby — dropdown */}
        <select className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-green-400 max-w-[140px]"
          value={filterPerson} onChange={e => setFilterPerson(e.target.value)}>
          <option value="">👤 Wszyscy</option>
          {allMembers.map(m => (
            <option key={m.id} value={m.id}>{m.display_name}</option>
          ))}
        </select>

        {/* Filtr daty — chipy */}
        <div className="flex gap-1 flex-wrap">
          {[['','Wszystkie'],['overdue','⚠️ Przeterminowane'],['today','Dziś'],['week','Ten tydzień'],['month','Ten miesiąc']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilterDeadline(val)}
              className={`text-[10px] px-2 py-1 rounded-full border transition whitespace-nowrap ${
                filterDeadline === val ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'
              }`}>{lbl}</button>
          ))}
        </div>

        {/* Filtr priorytetów */}
        <div className="flex gap-1">
          {[['', '●'],['urgent','🔴'],['high','🟠'],['medium','🟡'],['low','⚪']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilterPriority(val)} title={val || 'Wszystkie'}
              className={`text-sm px-2 py-1 rounded-full border transition ${
                filterPriority === val ? 'bg-green-700 border-green-700 opacity-100' : 'bg-white border-gray-200 hover:border-green-400 opacity-70'
              }`}>{lbl}</button>
          ))}
        </div>

        {(filterPerson || filterDeadline || filterPriority) && (
          <button onClick={() => { setFilterPerson(''); setFilterDeadline(''); setFilterPriority('') }} className="text-xs text-gray-400 underline shrink-0">Wyczyść</button>
        )}

        <div className="ml-auto flex gap-2 shrink-0">
          {tasks.length > 0 && (
            <button onClick={handleResetTasks}
              className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">🗑 Reset</button>
          )}
          <button onClick={handleLoadTemplate}
            className="text-xs border border-green-300 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50">📋 Szablon obozu</button>
          <button onClick={() => setShowInvite(true)}
            className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-800">+ Zaproś</button>
        </div>
      </div>

      {/* Kolumny */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4">
        {COLUMNS.filter(c => c.id !== 'archived' || showArchived).map(col => {
          const colTasks = filtered.filter(t => t.column === col.id)
          return (
            <div key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, col.id)}
              className={`flex-1 min-w-[240px] max-w-[340px] rounded-xl ${col.color} p-3 flex flex-col`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-gray-700">{col.dot} {col.label}</span>
                <span className="text-xs text-gray-400">{colTasks.length}</span>
              </div>
              <div className="flex-1 space-y-0.5 overflow-y-auto">
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={setSelectedTask} members={allMembers} onUpdate={load} onComplete={fireConfetti} />
                ))}

                    {addingCol === col.id ? (
                  <div className="bg-white border border-green-300 rounded-xl p-2 space-y-1.5">
                    <input autoFocus className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400"
                      placeholder="Nazwa zadania..." value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') setAddingCol(null) }} />
                    <select className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5" value={newAssignee}
                      onChange={e => setNewAssignee(e.target.value)}>
                      <option value="">Bez przypisania</option>
                      {allMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.display_name}{m.isOwner ? ' 👑' : ''}</option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button onClick={handleAddTask} className="flex-1 bg-green-700 text-white text-xs rounded-lg py-1 font-bold">Dodaj</button>
                      <button onClick={() => setAddingCol(null)} className="text-xs px-2 text-gray-400">×</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingCol(col.id)}
                    className="mt-2 text-xs text-gray-400 hover:text-green-600 border border-dashed border-gray-300 rounded-lg py-1.5 hover:border-green-400 transition">
                    + Dodaj zadanie
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Przycisk archiwum */}
      {!showArchived && (
        <button onClick={() => setShowArchived(true)}
          className="text-xs text-gray-400 text-center py-2 border-t border-gray-200 hover:text-green-600">
          📦 Pokaż archiwum
        </button>
      )}

      {/* Activity Feed */}
      <div className="border-t border-gray-200 bg-white px-4 py-2 shrink-0 max-h-32 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 mb-1">Aktywność</p>
        {feed.length === 0 ? (
          <p className="text-xs text-gray-300">Brak aktywności</p>
        ) : feed.slice(0, 10).map((a, i) => (
          <div key={i} className="text-xs text-gray-500 py-0.5">
            {new Date(a.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            {' · '}{a.action}
            {a.meta?.title ? ` "${a.meta.title}"` : ''}
          </div>
        ))}
      </div>

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onInvited={() => { setShowInvite(false); load() }} />
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={load}
          isDruzynowy={true}
          user={user}
        />
      )}

      <Confetti active={confetti} origin={confettiOrigin} onDone={() => setConfetti(false)} />
    </div>
  )
}
