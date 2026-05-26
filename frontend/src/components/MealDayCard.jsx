import { useState } from 'react'
import MealSlotRow from './MealSlotRow'
import { makeMealSlot } from './MealTemplatePanel'

export default function MealDayCard({ day, index, mealActivities, onChange, onDelete, peopleCount }) {
  const [collapsed, setCollapsed] = useState(false)
  const slots = day.mealSlots || []

  const addSlot = () => {
    const lastTime = slots.length > 0 ? slots[slots.length - 1].time : ''
    onChange({ ...day, mealSlots: [...slots, makeMealSlot('', lastTime)] })
  }

  const updateSlot = (slotId, updated) =>
    onChange({ ...day, mealSlots: slots.map(s => s.id === slotId ? updated : s) })

  const deleteSlot = (slotId) =>
    onChange({ ...day, mealSlots: slots.filter(s => s.id !== slotId) })

  const moveSlot = (idx, dir) => {
    const arr = [...slots]; const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onChange({ ...day, mealSlots: arr })
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden mb-4">
      <div className="flex items-center gap-3 bg-blue-600 px-4 py-2.5">
        <button onClick={() => setCollapsed(c => !c)}
          className="text-white/70 hover:text-white text-lg w-5 text-center">{collapsed ? '▶' : '▼'}</button>
        <span className="text-white font-bold text-sm whitespace-nowrap">Dzień {index + 1}</span>
        <input className="flex-1 bg-transparent border-b border-white/40 text-white text-sm placeholder-white/50 focus:outline-none focus:border-white"
          placeholder="Tytuł dnia..."
          value={day.label}
          onChange={e => onChange({ ...day, label: e.target.value })} />
        <button onClick={onDelete}
          className="text-white/50 hover:text-red-300 text-xs ml-2">🗑 Usuń</button>
      </div>
      {!collapsed && (
        <div className="p-2">
          <div className="flex gap-2 px-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span className="w-24 shrink-0">Godzina</span>
            <span className="flex-1">Posiłek</span>
            <span className="flex-1">Składniki</span>
            <span className="flex-1">Opis</span>
            <span className="w-5" />
          </div>
          {slots.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Brak posiłków — kliknij „+ Dodaj posiłek"</p>
          )}
          {slots.map((slot, i) => (
            <div key={slot.id} className="flex items-start gap-1 group">
              <div className="flex flex-col pt-1.5 shrink-0 w-7 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => moveSlot(i, -1)} disabled={i === 0}
                  className="text-gray-300 hover:text-blue-700 disabled:opacity-0 text-xs leading-none">▲</button>
                <button onClick={() => moveSlot(i, 1)} disabled={i === slots.length - 1}
                  className="text-gray-300 hover:text-blue-700 disabled:opacity-0 text-xs leading-none">▼</button>
              </div>
              <div className="flex-1">
                <MealSlotRow slot={slot} mealActivities={mealActivities}
                  onChange={updated => updateSlot(slot.id, updated)}
                  onDelete={() => deleteSlot(slot.id)}
                  peopleCount={peopleCount} />
              </div>
            </div>
          ))}
          <button onClick={addSlot}
            className="mt-2 w-full text-sm text-blue-700 border border-dashed border-blue-400 rounded-lg py-1.5 hover:bg-blue-50 transition">
            + Dodaj posiłek
          </button>
        </div>
      )}
    </div>
  )
}
