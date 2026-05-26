import { useState } from 'react'
import MealTemplatePanel, { makeMealSlot } from './MealTemplatePanel'
import MealDayCard from './MealDayCard'

export default function JadlospisTab({ meta, days, mealTemplate, mealActivities, onUpdate, onAddMealActivity, onEditMealActivity, onDeleteMealActivity, progress, onToggleProgress }) {
  const [daysCount, setDaysCount] = useState('')
  const [peopleCount, setPeopleCount] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'
  const ppl = parseInt(peopleCount) || 0

  // Fix crash: guardy
  const safeMealTemplate = mealTemplate || []
  const safeMealActivities = mealActivities || []
  const safeDays = days || []

  const setMeanDays = (n) => {
    const count = Math.max(1, Math.min(30, parseInt(n) || 0))
    if (!count) return
    const newDays = Array.from({ length: count }, (_, i) => {
      const existing = safeDays[i]
      if (existing) return existing
      const day = { id: `day_${Date.now()}_${i}`, label: '', slots: existing?.slots || [], mealSlots: [] }
      day.mealSlots = safeMealTemplate.map(s => ({ ...s, id: `ms_${Date.now()}_${Math.random()}` }))
      return day
    })
    onUpdate({ days: newDays })
    setDaysCount('')
  }

  const updateDay = (id, updated) =>
    onUpdate({ days: safeDays.map(d => d.id === id ? updated : d) })

  const addDay = () => {
    const day = { id: `day_${Date.now()}_${safeDays.length}`, label: '', slots: [], mealSlots: [] }
    day.mealSlots = safeMealTemplate.map(s => ({ ...s, id: `ms_${Date.now()}_${Math.random()}` }))
    onUpdate({ days: [...safeDays, day] })
  }

  const deleteDay = (id) =>
    onUpdate({ days: safeDays.filter(d => d.id !== id) })

  const handleAddMeal = () => {
    const name = newName.trim()
    if (!name) return
    onAddMealActivity(name, newDesc.trim())
    setNewName(''); setNewDesc('')
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Lewy panel — szablon (jak Plan zajęć) */}
      <aside className="w-[420px] shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        {meta.date_start && meta.date_end && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 font-medium">
            Obóz: {meta.date_start} – {meta.date_end}
          </div>
        )}
        <div className="p-4 border-b border-gray-100">
          <MealTemplatePanel slots={safeMealTemplate}
            onChange={newSlots => {
              const existingIds = new Set(safeMealTemplate.map(s => s.id))
              const added = newSlots.filter(s => !existingIds.has(s.id))
              if (added.length > 0 && safeDays.length > 0) {
                onUpdate({ mealTemplate: newSlots, days: safeDays.map(day => ({
                  ...day,
                  mealSlots: [...((day.mealSlots) || []), ...added.map(s => ({ ...s, id: `ms_${Date.now()}_${Math.random()}` }))]
                })) })
              } else onUpdate({ mealTemplate: newSlots })
            }}
            mealActivities={safeMealActivities} />
        </div>
        <div className="p-4 flex-1">
          <h4 className="font-bold text-sm text-gray-700 mb-3">📋 Katalog dań</h4>
          <div className="space-y-2 mb-4">
            <input className={inp} placeholder="Nazwa dania (np. Zupa pomidorowa)"
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMeal()} />
            <input className={inp} placeholder="Opis (opcjonalnie)"
              value={newDesc} onChange={e => setNewDesc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMeal()} />
            <button onClick={handleAddMeal}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
              + Dodaj danie
            </button>
          </div>
          {safeMealActivities.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">Brak własnych dań</p>
          )}
          <div className="space-y-1">
            {safeMealActivities.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2 group text-sm px-2 py-1 rounded hover:bg-gray-50">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <span className="flex-1 text-gray-700 truncate">{a.name}</span>
                <button onClick={() => onDeleteMealActivity(a.id)}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 text-xs">×</button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Prawy panel — dni */}
      <main className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">🍲 Jadłospis</h2>
          <button onClick={(e) => onToggleProgress?.('jadlospis', e)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
              progress?.jadlospis ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-300 hover:border-green-400'
            }`}>
            {progress?.jadlospis ? '✅' : '⬜'} Zrobione
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-sm font-semibold text-gray-700">📅 Dni:</span>
          <input type="number" min={1} max={30}
            className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="np. 10" value={daysCount}
            onChange={e => setDaysCount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setMeanDays(daysCount)} />
          <button onClick={() => setMeanDays(daysCount)}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700">
            Ustaw
          </button>
          <span className="text-sm font-semibold text-gray-700 ml-4">👥 Osób:</span>
          <input type="number" min={1} max={999}
            className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="32" value={peopleCount}
            onChange={e => setPeopleCount(e.target.value)} />
          {safeDays.length > 0 && <span className="text-sm text-gray-500 ml-4">Zaplanowane: <b>{safeDays.length}</b> dni</span>}
          <button onClick={addDay}
            className="ml-auto text-sm text-blue-700 border border-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-50">
            + Dodaj dzień
          </button>
        </div>

        {safeDays.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">🍲</div>
            <p className="text-lg font-semibold">Wpisz liczbę dni i kliknij „Ustaw"</p>
          </div>
        )}
        {safeDays.map((day, i) => (
          <MealDayCard key={day.id} day={day} index={i} mealActivities={safeMealActivities}
            onChange={updated => updateDay(day.id, updated)}
            onDelete={() => deleteDay(day.id)}
            peopleCount={ppl} />
        ))}
      </main>
    </div>
  )
}
