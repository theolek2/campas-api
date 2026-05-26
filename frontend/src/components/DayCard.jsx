import { useState } from 'react'
import SlotRow from './SlotRow'
import { makeSlot } from '../utils/defaults'

export default function DayCard({ day, index, activities, onChange, onDelete }) {
  const [collapsed, setCollapsed] = useState(false)

  const addSlot = () => {
    const lastTime = day.slots.length > 0 ? day.slots[day.slots.length - 1].time : ''
    onChange({ ...day, slots: [...day.slots, makeSlot('', lastTime)] })
  }

  const updateSlot = (slotId, updated) =>
    onChange({ ...day, slots: day.slots.map(s => s.id === slotId ? updated : s) })

  const deleteSlot = (slotId) =>
    onChange({ ...day, slots: day.slots.filter(s => s.id !== slotId) })

  const moveSlot = (index, dir) => {
    const arr = [...day.slots]
    const target = index + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    onChange({ ...day, slots: arr })
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden mb-4">
      {/* Nagłówek */}
      <div className="flex items-center gap-3 bg-green-700 px-4 py-2.5">
        <button onClick={() => setCollapsed(c => !c)}
          className="text-white/70 hover:text-white text-lg w-5 text-center">
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="text-white font-bold text-sm whitespace-nowrap">Dzień {index + 1}</span>
        <input
          className="flex-1 bg-transparent border-b border-white/40 text-white text-sm placeholder-white/50 focus:outline-none focus:border-white"
          placeholder="Tytuł dnia (opcjonalnie)..."
          value={day.label}
          onChange={e => onChange({ ...day, label: e.target.value })}
        />
        <button onClick={onDelete}
          className="text-white/50 hover:text-red-300 text-xs ml-2">
          🗑 Usuń
        </button>
      </div>

      {!collapsed && (
        <div className="p-2">
          <div className="flex gap-2 px-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span className="w-8 shrink-0"></span>
            <span className="w-24 shrink-0">Godzina</span>
            <span className="flex-1">Zajęcie</span>
            <span className="flex-1">Opis / uwagi</span>
            <span className="w-5"></span>
          </div>

          {day.slots.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Brak zajęć — kliknij „+ Dodaj zajęcie"
            </p>
          )}

          {day.slots.map((slot, i) => (
            <div key={slot.id} className="flex items-start gap-1 group">
              {/* Strzałki kolejności */}
              <div className="flex flex-col pt-1.5 shrink-0 w-7 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => moveSlot(i, -1)}
                  disabled={i === 0}
                  className="text-gray-300 hover:text-green-700 disabled:opacity-0 text-xs leading-none"
                >▲</button>
                <button
                  onClick={() => moveSlot(i, 1)}
                  disabled={i === day.slots.length - 1}
                  className="text-gray-300 hover:text-green-700 disabled:opacity-0 text-xs leading-none"
                >▼</button>
              </div>

              <div className="flex-1">
                <SlotRow
                  slot={slot}
                  activities={activities}
                  onChange={updated => updateSlot(slot.id, updated)}
                  onDelete={() => deleteSlot(slot.id)}
                />
              </div>
            </div>
          ))}

          <button
            onClick={addSlot}
            className="mt-2 w-full text-sm text-green-700 border border-dashed border-green-400 rounded-lg py-1.5 hover:bg-green-50 transition"
          >
            + Dodaj zajęcie
          </button>
        </div>
      )}
    </div>
  )
}
