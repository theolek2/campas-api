import { useState } from 'react'
import { FIXED_MEALS } from '../utils/defaults'
import TagInput from './TagInput'

function makeMealSlot(name = '', description = '', ingredients = '') {
  return { id: `ms_${Date.now()}_${Math.random()}`, time: '', name, description, ingredients }
}

export default function MealTemplatePanel({ slots, onChange, mealActivities = [] }) {
  const [open, setOpen] = useState(true)

  const addSlot = (name = '', description = '', ingredients = '') =>
    onChange([...slots, makeMealSlot(name, description, ingredients)])

  const updateSlot = (id, patch) =>
    onChange(slots.map(s => s.id === id ? { ...s, ...patch } : s))

  const deleteSlot = (id) => onChange(slots.filter(s => s.id !== id))

  const moveSlot = (i, dir) => {
    const arr = [...slots]; const t = i + dir
    if (t < 0 || t >= arr.length) return
    ;[arr[i], arr[t]] = [arr[t], arr[i]]; onChange(arr)
  }

  const quickAdd = (name, description = '', ingredients = '') => {
    const already = slots.some(s => s.name === name)
    if (already) deleteSlot(slots.find(s => s.name === name)?.id)
    else addSlot(name, description, ingredients)
  }

  const allMeals = [
    ...FIXED_MEALS,
    ...(mealActivities || []).map(a => ({ id: a.id, name: a.name, description: a.description, ingredients: a.ingredients || '' })),
  ]

  return (
    <div className="border border-blue-300 rounded-xl bg-blue-50 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-600 text-white">
        <span className="font-bold text-sm flex items-center gap-2">
          🔄 Powtarzaj codziennie
          {slots.length > 0 && <span className="bg-blue-500 text-xs px-1.5 py-0.5 rounded-full">{slots.length}</span>}
        </span>
        <span className="text-white/70 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-3">
          <p className="text-xs text-blue-800 mb-3">Dodaj tu posiłki które powtarzają się każdego dnia — zostaną wstawione do nowych dni.</p>

          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Stałe posiłki:</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {FIXED_MEALS.map(m => {
                const added = slots.some(s => s.name === m.name)
                return (
                  <button key={m.id} onClick={() => quickAdd(m.name, m.description)}
                    className={`text-xs px-2 py-1 rounded-full border transition ${added ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-500'}`}>
                    {added ? '✓ ' : '+ '}{m.name}
                  </button>
                )
              })}
            </div>
            {mealActivities.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Dania własne:</p>
                <div className="flex flex-wrap gap-1.5">
                  {mealActivities.map(a => {
                    const added = slots.some(s => s.name === a.name)
                    return (
                      <button key={a.id} onClick={() => quickAdd(a.name, a.description, a.ingredients)}
                        className={`text-xs px-2 py-1 rounded-full border transition ${added ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-sky-600 border-sky-300 hover:border-sky-500'}`}>
                        {added ? '✓ ' : '+ '}{a.name}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {slots.length > 0 && (
            <div className="space-y-1 mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Kolejność i godziny:</p>
              {slots.map((slot, i) => (
                <div key={slot.id} className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-blue-200 group">
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => moveSlot(i, -1)} disabled={i === 0}
                      className="text-gray-300 hover:text-blue-700 disabled:opacity-20 text-xs leading-none">▲</button>
                    <button onClick={() => moveSlot(i, 1)} disabled={i === slots.length - 1}
                      className="text-gray-300 hover:text-blue-700 disabled:opacity-20 text-xs leading-none">▼</button>
                  </div>
                  <input type="time" value={slot.time}
                    onChange={e => updateSlot(slot.id, { time: e.target.value })}
                    className="w-24 border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-400" />
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{slot.name}</span>
                  <TagInput value={slot.ingredients || ''}
                    onChange={val => updateSlot(slot.id, { ingredients: val })}
                    placeholder="Składniki..." />
                  <button onClick={() => deleteSlot(slot.id)}
                    className="text-red-300 hover:text-red-600 text-sm opacity-0 group-hover:opacity-100 transition shrink-0">×</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => addSlot()}
            className="w-full text-xs text-blue-700 border border-dashed border-blue-400 rounded-lg py-1.5 hover:bg-blue-100 transition">
            + Dodaj inny posiłek do szablonu
          </button>
        </div>
      )}
    </div>
  )
}

export { makeMealSlot }
