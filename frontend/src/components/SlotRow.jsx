import { useState } from 'react'
import { FIXED_ACTIVITIES } from '../utils/defaults'

export default function SlotRow({ slot, activities, onChange, onDelete }) {
  const [open, setOpen] = useState(false)

  const allActivities = [
    ...FIXED_ACTIVITIES,
    ...activities.map(a => ({ id: a.id, name: a.name, description: a.description })),
  ]

  const selectActivity = (a) => {
    onChange({ ...slot, name: a.name, description: a.description })
    setOpen(false)
  }

  return (
    <div className="slot-row flex items-start gap-2 px-2 py-1.5 rounded group">
      {/* Czas */}
      <input
        type="time"
        value={slot.time}
        onChange={e => onChange({ ...slot, time: e.target.value })}
        className="w-24 border border-gray-300 rounded px-1.5 py-1 text-sm focus:outline-none focus:border-green-500 shrink-0"
      />

      {/* Nazwa zajęcia */}
      <div className="flex-1 min-w-0 relative">
        <input
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
          placeholder="Zajęcie..."
          value={slot.name}
          onChange={e => onChange({ ...slot, name: e.target.value })}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && (
          <div className="absolute top-full left-0 z-50 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
            {allActivities
              .filter(a => a.name.toLowerCase().includes(slot.name.toLowerCase()))
              .map(a => (
                <div key={a.id}
                  onMouseDown={() => selectActivity(a)}
                  className="px-3 py-1.5 text-sm hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{a.name}</span>
                  {a.description && (
                    <span className="text-gray-400 text-xs ml-2 truncate">{a.description.slice(0, 40)}</span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Opis */}
      <input
        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
        placeholder="Opis / uwagi..."
        value={slot.description}
        onChange={e => onChange({ ...slot, description: e.target.value })}
      />

      {/* Usuń */}
      <button
        onClick={onDelete}
        className="shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-lg leading-none mt-0.5"
      >
        ×
      </button>
    </div>
  )
}
