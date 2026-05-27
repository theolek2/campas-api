import { useState, useEffect, useRef } from 'react'
import {
  updateTask, deleteTask, toggleChecklistItem, addChecklistItem, deleteChecklistItem,
  addTaskComment, getTaskComments, uploadSharedFile, getTeamMembers, logActivity,
} from '../lib/api'

const COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#6b7280' }

export default function TaskModal({ task, onClose, onUpdate, isDruzynowy, user }) {
  const [title, setTitle] = useState(task.title || '')
  const [desc, setDesc] = useState(task.description || '')
  const [prio, setPrio] = useState(task.priority || 'medium')
  const [deadline, setDeadline] = useState(task.deadline?.split('T')[0] || '')
  const [col, setCol] = useState(task.column || 'todo')
  const [checklist, setChecklist] = useState([])
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [attachments, setAttachments] = useState([])
  // assigned_to po joinie Supabase może być obiektem {id, display_name} — wyciągnij samo id
  const getAssignedId = () => {
    if (!task.assigned_to) return ''
    if (typeof task.assigned_to === 'object') return task.assigned_to.id || ''
    return task.assigned_to || ''
  }
  const [assignee, setAssignee] = useState(getAssignedId())
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const load = async () => {
    const campId = localStorage.getItem('campas_camp_id') || ''
    // Checklista i komentarze są w task.checklists (zwracane przez GET /tasks)
    setChecklist(task.checklists || [])
    if (campId) {
      const cm = await getTaskComments(campId, task.id)
      setComments(cm || [])
      try {
        const m = await getTeamMembers(campId)
        setMembers(m || [])
      } catch {}
    }
  }

  const save = async (patch) => {
    if (saving) return
    setSaving(true)
    const campId = localStorage.getItem('campas_camp_id') || ''
    try {
      await updateTask(campId, task.id, patch)
      onUpdate?.()
    } catch {}
    setSaving(false)
  }

  useEffect(() => { load() }, [task.id])

  const toggleSubtask = async (item) => {
    const campId = localStorage.getItem('campas_camp_id') || ''
    const done = !item.done
    await toggleChecklistItem(campId, task.id, item.id, done, null)
    setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, done } : c))
  }

  const addSubtask = async () => {
    const campId = localStorage.getItem('campas_camp_id') || ''
    const text = newSubtask.trim()
    if (!text || !campId) return
    await addChecklistItem(campId, task.id, { text, order: checklist.length })
    setNewSubtask('')
    load()
  }

  const addComment = async () => {
    const campId = localStorage.getItem('campas_camp_id') || ''
    const text = commentText.trim()
    if (!text || !campId) return
    await addTaskComment(campId, task.id, { content: text, user_type: user ? 'internal' : 'guest', user_id: user?.id || null })
    setCommentText('')
    load()
  }

  const uploadAttachment = async (e) => {
    const campId = localStorage.getItem('campas_camp_id') || ''
    const file = e.target.files?.[0]
    if (!file || !campId) return
    try {
      await uploadSharedFile(campId, file)
      load()
    } catch (err) {
      alert('Błąd uploadu: ' + err.message)
    }
  }

  const doneCount = checklist.filter(c => c.done).length

  return (
    <div className="fixed inset-0 bg-black/40 z-[4000] flex" onClick={onClose}>
      <div className="flex-1 max-w-4xl mx-auto my-8 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Nagłówek */}
        <div className="bg-green-800 text-white px-6 py-4 flex items-center gap-4 shrink-0">
          <input
            className="flex-1 bg-transparent text-lg font-bold border-none outline-none placeholder-white/50"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => title !== task.title && save({ title })}
            placeholder="Tytuł zadania"
          />
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/20 text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>

        {/* Treść */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lewa kolumna */}
            <div className="space-y-5">
              {/* Opis */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Opis</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none"
                  rows={4} value={desc}
                  onChange={e => setDesc(e.target.value)}
                  onBlur={() => desc !== (task.description || '') && save({ description: desc })}
                  placeholder="Opis zadania..."
                />
              </div>

              {/* Metadane */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Priorytet</label>
                  <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm"
                    value={prio} onChange={e => { setPrio(e.target.value); save({ priority: e.target.value }) }}>
                    {Object.entries({ low:'Niski', medium:'Średni', high:'Wysoki', urgent:'Pilne' }).map(([k,v]) => (
                      <option key={k} value={k}>● {v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Deadline</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm"
                    value={deadline} onChange={e => { setDeadline(e.target.value); save({ deadline: e.target.value || null }) }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Przypisany</label>
                  <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm"
                    value={assignee} onChange={e => { setAssignee(e.target.value); save({ assigned_to: e.target.value || null }) }}>
                    <option value="">Brak</option>
                    {members.length === 0 && <option disabled>⏳ Ładowanie...</option>}
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.display_name || m.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Kolumna</label>
                  <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm"
                    value={col} onChange={e => { setCol(e.target.value); save({ column: e.target.value }) }}>
                    <option value="todo">Do zrobienia</option>
                    <option value="in_progress">W trakcie</option>
                    <option value="done">Zrobione</option>
                    <option value="archived">Archiwum</option>
                  </select>
                </div>
              </div>

              {/* Załączniki */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  📎 Załączniki ({attachments.length})
                </label>
                <div className="space-y-1 mb-2">
                  {attachments.map(a => (
                    <div key={a.id} className="flex items-center gap-2 text-xs border border-gray-100 rounded-lg px-2 py-1">
                      <span className="text-gray-500">📄</span>
                      <span className="flex-1 truncate">{a.filename}</span>
                      <span className="text-gray-400">{a.size ? (a.size/1024).toFixed(0)+'KB' : ''}</span>
                    </div>
                  ))}
                </div>
                <input ref={fileRef} type="file" className="hidden" onChange={uploadAttachment} />
                <button onClick={() => fileRef.current?.click()}
                  className="text-xs border border-dashed border-gray-300 rounded-lg py-1.5 px-3 text-gray-400 hover:text-green-600 hover:border-green-400 w-full">
                  + Wgraj plik
                </button>
              </div>
            </div>

            {/* Prawa kolumna */}
            <div className="space-y-5">
              {/* Subtaski */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  ☑ Subtaski ({doneCount}/{checklist.length})
                </label>
                <div className="space-y-1 mb-2">
                  {checklist.map(item => (
                    <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
                      <input type="checkbox" checked={item.done} onChange={() => toggleSubtask(item)}
                        className="accent-green-600 w-4 h-4" />
                      <span className={item.done ? 'line-through text-gray-400' : 'text-gray-700'}>{item.text}</span>
                      {item.done_by && <span className="text-xs text-gray-400 ml-auto">✓</span>}
                    </label>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400"
                    placeholder="Nowy subtask..." value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSubtask()} />
                  <button onClick={addSubtask} className="text-xs bg-green-700 text-white rounded-lg px-3 py-1.5 font-bold">+</button>
                </div>
              </div>

              {/* Komentarze */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  💬 Komentarze ({comments.length})
                </label>
                <div className="space-y-2 mb-2 max-h-48 overflow-y-auto">
                  {comments.map(c => (
                    <div key={c.id} className="text-xs border border-gray-100 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-500">{new Date(c.created_at).toLocaleDateString('pl-PL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                      <p className="text-gray-700 mt-0.5">{c.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400"
                    placeholder="Napisz komentarz..." value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()} />
                  <button onClick={addComment} className="text-xs bg-green-700 text-white rounded-lg px-3 py-1.5 font-bold">Wyślij</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stopka */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={async () => {
              if (!confirm('Usunąć to zadanie?')) return
              await deleteTask(campId, task.id)
              logActivity('task_deleted', { title: task.title })
              onUpdate?.()
              onClose()
            }}
            className="text-xs text-red-400 hover:text-red-600">
            🗑 Usuń zadanie
          </button>
          <div className="text-xs text-gray-400">
            {saving ? 'Zapisywanie...' : '✓ Zapisano'}
          </div>
        </div>
      </div>
    </div>
  )
}
