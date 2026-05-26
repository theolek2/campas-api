import { useState } from 'react'
import { FIXED_ACTIVITIES } from '../utils/defaults'

export default function ActivityPanel({ activities, onAdd, onEdit, onDelete }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [editId, setEditId] = useState(null)

  const handleSave = () => {
    if (!name.trim()) return
    if (editId) {
      onEdit(editId, name.trim(), desc.trim())
      setEditId(null)
    } else {
      onAdd(name.trim(), desc.trim())
    }
    setName('')
    setDesc('')
  }

  const startEdit = (a) => {
    setEditId(a.id)
    setName(a.name)
    setDesc(a.description)
  }

  const cancel = () => { setEditId(null); setName(''); setDesc('') }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-bold text-green-800 mb-3">📋 Zajęcia własne</h2>

      {/* Formularz dodawania */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <input
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-2 focus:outline-none focus:border-green-500"
          placeholder="Nazwa zajęcia..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <textarea
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-2 resize-none focus:outline-none focus:border-green-500"
          placeholder="Opis / program zajęcia..."
          rows={3}
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-700 text-white rounded py-1.5 text-sm font-semibold hover:bg-green-800"
          >
            {editId ? '💾 Zapisz zmiany' : '+ Dodaj zajęcie'}
          </button>
          {editId && (
            <button onClick={cancel} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-100">
              Anuluj
            </button>
          )}
        </div>
      </div>

      {/* Lista zajęć własnych */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {activities.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Brak zajęć — dodaj pierwsze!</p>
        )}
        {activities.map((a, i) => (
          <div key={a.id}
            className="border border-gray-200 rounded-lg p-2.5 bg-white hover:border-green-400 transition group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-green-900">
                  {i + 1}. {a.name}
                </span>
                {a.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{a.description}</p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                <button onClick={() => startEdit(a)}
                  className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                  ✏️
                </button>
                <button onClick={() => onDelete(a.id)}
                  className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded hover:bg-red-100">
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stałe zajęcia */}
      <div>
        <h3 className="text-sm font-bold text-gray-600 mb-2">⚓ Stałe elementy dnia</h3>
        <div className="flex flex-wrap gap-1.5">
          {FIXED_ACTIVITIES.map(f => (
            <span key={f.id}
              className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded-full text-gray-700">
              {f.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
