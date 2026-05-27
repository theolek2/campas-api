import { useState } from 'react'
import { FIXED_MEALS } from '../utils/defaults'

function IngredientRow({ ing, index, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-gray-400 w-4">{index + 1}.</span>
      <input className="flex-1 border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:border-blue-400 min-w-0"
        placeholder="Składnik" value={ing.name || ''}
        onChange={e => onChange({ ...ing, name: e.target.value })} />
      <input className="w-14 border border-gray-200 rounded px-1.5 py-1 text-center focus:outline-none focus:border-blue-400"
        type="number" min="0" step="0.1" placeholder="ilość" value={ing.qty || ''}
        onChange={e => onChange({ ...ing, qty: parseFloat(e.target.value) || 0 })} />
      <select className="w-16 border border-gray-200 rounded px-1 py-1 text-center text-xs focus:outline-none focus:border-blue-400"
        value={ing.unit || 'g'} onChange={e => onChange({ ...ing, unit: e.target.value })}>
        <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option>
        <option value="L">L</option><option value="szt">szt</option>
        <option value="łyżka">łyżka</option>
        <option value="łyżeczka">łyżeczka</option>
        <option value="szklanka">szklanka</option>
        <option value="opakowanie">opak.</option>
        <option value="plaster">plaster</option><option value="kromka">kromka</option>
        <option value="ząbek">ząbek</option><option value="szczypta">szczypta</option>
        <option value="puszka">puszka</option><option value="słoik">słoik</option>
      </select>
      <label className="flex items-center gap-0.5 text-gray-400">
        <input type="checkbox" checked={ing.perPerson !== false} className="w-3 h-3"
          onChange={e => onChange({ ...ing, perPerson: e.target.checked })} />
        ×os.
      </label>
      <button onClick={onDelete} className="text-gray-300 hover:text-red-500 text-sm leading-none">×</button>
    </div>
  )
}

export default function MealSlotRow({ slot, mealActivities, onChange, onDelete, peopleCount = 1 }) {
  const [open, setOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const ingredients = slot.ingredients || []
  // Kompatybilność: konwertuj stare stringi do nowego formatu
  const normalized = (() => {
    if (Array.isArray(ingredients)) return ingredients
    if (typeof ingredients === 'string' && ingredients.trim()) {
      return ingredients.split(',').map(s => ({ name: s.trim(), qty: 0, unit: 'szt' }))
    }
    return []
  })()

  const allMeals = [
    ...FIXED_MEALS,
    ...(mealActivities || []).map(a => ({ id: a.id, name: a.name, description: a.description })),
  ]

  const selectMeal = (m) => {
    onChange({ ...slot, name: m.name })
    setOpen(false)
  }

  const updateIngredient = (i, updated) => {
    const arr = [...normalized]
    arr[i] = updated
    onChange({ ...slot, ingredients: arr })
  }

  const addIngredient = () => {
    onChange({ ...slot, ingredients: [...normalized, { name: '', qty: 0, unit: 'g', perPerson: true }] })
  }

  const deleteIngredient = (i) => {
    const arr = normalized.filter((_, idx) => idx !== i)
    onChange({ ...slot, ingredients: arr })
  }

  const suggestAI = async () => {
    if (!slot.name) return alert('Najpierw wpisz nazwę posiłku')
    setAiLoading(true)
    try {
      const tok = localStorage.getItem('campas_token') || ''
      const res = await fetch('/api/robert/suggest-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ meal_name: slot.name, people_count: peopleCount || 10 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Błąd AI')
      onChange({ ...slot, ingredients: data.ingredients })
    } catch (e) {
      alert('Błąd AI: ' + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const total = (ing) => {
    if (!ing.qty || !ing.perPerson) return ing.qty || 0
    return (ing.qty * (peopleCount || 1)).toFixed(1)
  }

  return (
    <div className="border border-gray-200 rounded-xl p-3 mb-2 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <input type="time" value={slot.time || ''}
          onChange={e => onChange({ ...slot, time: e.target.value })}
          className="w-24 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 shrink-0" />
        <div className="flex-1 min-w-0 relative">
          <input className="w-full border border-gray-200 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-blue-400"
            placeholder="Posiłek..." value={slot.name || ''}
            onChange={e => onChange({ ...slot, name: e.target.value })}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)} />
          {open && (
            <div className="absolute top-full left-0 z-50 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
              {allMeals.filter(m => m.name.toLowerCase().includes((slot.name || '').toLowerCase())).map(m => (
                <div key={m.id} onMouseDown={() => selectMeal(m)}
                  className="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">
                  <span className="font-medium">{m.name}</span>
                  {m.description && <span className="text-gray-400 text-xs ml-2 truncate">{m.description}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={onDelete}
          className="text-gray-300 hover:text-red-500 text-sm leading-none shrink-0">×</button>
      </div>

      {/* Składniki */}
      <div className="space-y-1 mb-2">
        {normalized.map((ing, i) => (
          <IngredientRow key={i} ing={ing} index={i}
            onChange={(updated) => updateIngredient(i, updated)}
            onDelete={() => deleteIngredient(i)} />
        ))}
        {normalized.length === 0 && (
          <p className="text-xs text-gray-300 py-1">Brak składników — dodaj ręcznie lub użyj 🧠 AI</p>
        )}
      </div>

      {/* Podsumowanie ilości × osób */}
      {normalized.length > 0 && (
        <div className="text-[10px] text-gray-400 mb-1">
          Ilości ×{peopleCount || 1} os.:
          {normalized.map((ing, i) => (
            <span key={i} className="ml-1">{ing.name} {total(ing)}{ing.unit}{i < normalized.length - 1 ? ',' : ''}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={addIngredient}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-400 hover:text-blue-600 hover:border-blue-400">
          + Składnik
        </button>
        <button onClick={suggestAI} disabled={aiLoading}
          className="text-xs bg-blue-500 text-white rounded-lg px-2.5 py-1 font-bold hover:bg-blue-600 disabled:opacity-50">
          {aiLoading ? '⏳ AI myśli...' : '🧠 Sugeruj składniki'}
        </button>
      </div>
    </div>
  )
}
