import { useState } from 'react'

export default function SpisZajecTab({ activities, onAdd, onEdit, onDelete }) {
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    onAdd(name, newDesc.trim())
    setNewName('')
    setNewDesc('')
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        <div>
          <h2 className="text-2xl font-bold text-green-900">📋 Spis zajęć</h2>
          <p className="text-sm text-gray-500 mt-1">
            Katalog wszystkich zajęć — pojawi się na stronie 2 dziennika. Numeracja automatyczna.
          </p>
        </div>

        {/* Dodaj nowe */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-3">Dodaj nowe zajęcie</h3>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nazwa</label>
              <input className={inp} placeholder="np. Plener malarski"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Opis (opcjonalnie)</label>
              <input className={inp} placeholder="Krótki opis..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <button onClick={handleAdd}
              className="shrink-0 bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-green-800 transition">
              + Dodaj
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-3">
            Zajęcia <span className="text-gray-400 font-normal text-sm ml-1">({activities ? activities.length : 0})</span>
          </h3>

          {(activities || []).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Brak zajęć — dodaj pierwsze powyżej</p>
          )}

          <div className="space-y-2">
            {(activities || []).map((a, i) => (
              <div key={a.id} className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input className={inp + ' font-medium'} placeholder="Nazwa zajęcia"
                    value={a.name}
                    onChange={e => onEdit(a.id, e.target.value, a.description)}
                  />
                  <input className={inp} placeholder="Opis (opcjonalnie)"
                    value={a.description}
                    onChange={e => onEdit(a.id, a.name, e.target.value)}
                  />
                </div>
                <button onClick={() => onDelete(a.id)}
                  className="text-gray-300 hover:text-red-500 text-lg leading-none shrink-0 opacity-0 group-hover:opacity-100 transition">×</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
