import { useState, useCallback } from 'react'
import { FIXED_ACTIVITIES } from '../utils/defaults'
import { generateDiary } from '../utils/generateDiary'

export default function DiaryTab({ meta, days, activities, onNavigate, onAddActivity, onEditActivity, onDeleteActivity, progress, onToggleProgress }) {
  const wychowawcyList = meta.wychowawcy?.filter(w => w.name) || []
  const [wybranyWychowawca, setWybranyWychowawca] = useState(wychowawcyList[0]?.name || '')

  const [planItems, setPlanItems] = useState([])
  const [dragIdx, setDragIdx] = useState(null)

  // Stan dla dodawania nowego zajecia do spisu
  const [newSpisName, setNewSpisName] = useState('')
  const [newSpisDesc, setNewSpisDesc] = useState('')

  const canGenerate = wybranyWychowawca.trim().length > 0

  const campDays = (meta.date_start && meta.date_end)
    ? Math.max(1, Math.ceil((new Date(meta.date_end) - new Date(meta.date_start)) / 86400000) + 1)
    : days.length

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'

  const addItem = (name = '', description = '', isBlok = false) =>
    setPlanItems(prev => [...prev, { id: Date.now(), time: '', name, description, isBlok }])

  const updateItem = (id, field, val) =>
    setPlanItems(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))

  const removeItem = (id) =>
    setPlanItems(prev => prev.filter(p => p.id !== id))

  const quickAdd = (name, description = '') => {
    const already = planItems.find(p => p.name === name && !p.isBlok)
    if (already) {
      removeItem(already.id)
    } else {
      addItem(name, description, false)
    }
  }

  const moveItem = useCallback((from, to) => {
    setPlanItems(prev => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
  }, [])

  const sorted = [...planItems].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))

  const handleGenerate = () => {
    generateDiary({ meta, days, wychowawca: wybranyWychowawca, planItems, campDays, activities })
  }

  const allTileActivities = [
    ...FIXED_ACTIVITIES.map(a => ({ id: a.id, name: a.name, description: a.description, source: 'fixed' })),
    ...(activities || []).map((a, i) => ({ id: a.id, name: a.name, description: a.description, source: 'spis', label: `${i + 1}. ${a.name}` })),
  ]

  const seen = new Set()
  const tileActivities = allTileActivities.filter(a => {
    if (seen.has(a.name)) return false
    seen.add(a.name)
    return true
  })

  const handleAddSpis = () => {
    const name = newSpisName.trim()
    if (!name) return
    onAddActivity(name, newSpisDesc.trim())
    setNewSpisName('')
    setNewSpisDesc('')
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        <div>
          <h2 className="text-2xl font-bold text-green-900">📓 Dziennik zajęć</h2>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={(e) => onToggleProgress?.('diary', e)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                progress?.diary ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-300 hover:border-green-400'
              }`}>
              {progress?.diary ? '✅' : '⬜'} Zrobione
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Zarządzaj spisem zajęć i wygeneruj dziennik dla wychowawcy — gotowy do druku (A5)
          </p>
        </div>

        {/* Brak danych obozu */}
        {(!meta.date_start || !meta.date_end) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold">Brak dat obozu</div>
              <div className="text-red-600 text-xs mt-0.5">Uzupełnij daty rozpoczęcia i zakończenia obozu</div>
            </div>
            <button onClick={() => onNavigate('Dane obozu')}
              className="shrink-0 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition">
              Przejdź do danych obozu →
            </button>
          </div>
        )}

        {/* Sekcja 1: Wychowawca */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-green-100 text-green-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            Wychowawca
          </h3>

          {wychowawcyList.length > 0 ? (
            <div className="space-y-2">
              {wychowawcyList.map(w => (
                <label key={w.name} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                  wybranyWychowawca === w.name ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-400'
                }`}>
                  <input type="radio" name="wychowawca" value={w.name}
                    checked={wybranyWychowawca === w.name}
                    onChange={() => setWybranyWychowawca(w.name)}
                    className="accent-green-600" />
                  <div>
                    <div className="font-semibold text-sm">{w.name}</div>
                    {w.phone && <div className="text-xs text-gray-400">{w.phone}</div>}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div className="flex-1">
                <div className="font-semibold">Brak wychowawców</div>
                <div className="text-red-600 text-xs mt-0.5">Dodaj wychowawców w danych obozu</div>
              </div>
              <button onClick={() => onNavigate('Dane obozu')}
                className="shrink-0 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition">
                Przejdź do danych obozu →
              </button>
            </div>
          )}
        </div>

        {/* Sekcja 2: Spis zajęć */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="bg-green-100 text-green-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Spis zajęć
            <span className="text-gray-400 font-normal text-sm ml-1">({activities ? activities.length : 0})</span>
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Katalog zajęć — pojawi się na stronie 2 dziennika. Numeracja automatyczna.
          </p>

          {/* Dodaj nowe */}
          <div className="flex gap-2 items-end mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nazwa</label>
              <input className={inp} placeholder="np. Plener malarski"
                value={newSpisName}
                onChange={e => setNewSpisName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSpis()}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Opis (opcjonalnie)</label>
              <input className={inp} placeholder="Krótki opis..."
                value={newSpisDesc}
                onChange={e => setNewSpisDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSpis()}
              />
            </div>
            <button onClick={handleAddSpis}
              className="shrink-0 bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-green-800 transition">
              + Dodaj
            </button>
          </div>

          {/* Lista spisu */}
          {(activities || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-300 rounded-lg">
              Brak zajęć w spisie — dodaj pierwsze powyżej
            </p>
          ) : (
            <div className="space-y-1.5">
              {(activities || []).map((a, i) => (
                <div key={a.id} className="flex items-center gap-2 group">
                  <div className="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input className={inp + ' font-medium'} placeholder="Nazwa zajęcia"
                      value={a.name}
                      onChange={e => onEditActivity(a.id, e.target.value, a.description)}
                    />
                    <input className={inp} placeholder="Opis (opcjonalnie)"
                      value={a.description}
                      onChange={e => onEditActivity(a.id, a.name, e.target.value)}
                    />
                  </div>
                  <button onClick={() => onDeleteActivity(a.id)}
                    className="text-gray-300 hover:text-red-500 text-lg leading-none shrink-0 opacity-0 group-hover:opacity-100 transition">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sekcja 3: Plan dnia dziennika */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="bg-green-100 text-green-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            Plan dnia dziennika
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Zbuduj plan dnia z kafli. Przeciągnij ⠿ aby zmienić kolejność. Czas każdego elementu ustawisz sam.
          </p>

          {/* Kafelki */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Dostępne zajęcia:</p>
            <div className="flex flex-wrap gap-1.5">
              {tileActivities.map(a => {
                const added = planItems.some(p => p.name === a.name && !p.isBlok)
                const colorClass = a.source === 'fixed'
                  ? (added ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500')
                  : (added ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-300 hover:border-emerald-500')
                const displayName = a.label || a.name
                return (
                  <button key={a.id} onClick={() => quickAdd(a.name, a.description)}
                    className={`text-xs px-2 py-1 rounded-full border transition ${colorClass}`}>
                    {added ? '✓ ' : '+ '}{displayName}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lista planu z drag&drop */}
          <div className="space-y-1 mb-3">
            {sorted.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Kliknij kafle powyżej aby zbudować plan dnia</p>
            )}
            {sorted.map((item, i) => (
              <div key={item.id}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-green-400') }}
                onDragLeave={e => e.currentTarget.classList.remove('ring-2', 'ring-green-400')}
                onDrop={e => {
                  e.currentTarget.classList.remove('ring-2', 'ring-green-400')
                  const targetIdx = sorted.findIndex(p => p.id === item.id)
                  moveItem(dragIdx, targetIdx)
                }}
                className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5 group hover:border-green-300 transition cursor-default"
              >
                <span className="text-gray-300 group-hover:text-green-600 cursor-grab active:cursor-grabbing text-sm select-none shrink-0">⠿</span>
                <input type="time" value={item.time}
                  onChange={e => updateItem(item.id, 'time', e.target.value)}
                  className="w-24 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-green-400 shrink-0" />
                <input className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-800 focus:outline-none focus:border-green-400 min-w-0"
                  placeholder={item.isBlok ? 'Blok zajęciowy' : 'Nazwa zajęcia'}
                  value={item.isBlok ? `Blok: ${item.name || ''}` : item.name}
                  onChange={e => updateItem(item.id, 'name', e.target.value.replace(/^Blok: /, ''))}
                />
                <textarea className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 focus:outline-none focus:border-green-400 resize-none min-w-0" rows={1}
                  placeholder="Opis..."
                  value={item.description}
                  onChange={e => updateItem(item.id, 'description', e.target.value)}
                />
                <button onClick={() => removeItem(item.id)}
                  className="text-gray-300 hover:text-red-500 text-lg leading-none shrink-0 opacity-0 group-hover:opacity-100 transition">×</button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => addItem()}
              className="flex-1 border-2 border-dashed border-green-400 rounded-xl py-2 text-xs text-green-700 hover:bg-green-50 transition">
              + Dodaj własne zajęcie
            </button>
            <button onClick={() => addItem('', '', true)}
              className="flex-1 border-2 border-dashed border-amber-400 rounded-xl py-2 text-xs text-amber-700 hover:bg-amber-50 transition">
              + Dodaj blok zajęciowy
            </button>
          </div>
        </div>

        {/* Podgląd struktury */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="bg-green-100 text-green-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">4</span>
            Struktura dziennika
          </h3>
          <div className="space-y-2 text-sm">
            {[
              ['📄 Strona 1', 'Strona tytułowa (wychowawca, obóz, termin)'],
              ['📋 Strona 2', `Spis zajęć (${activities ? activities.length : 0} pozycji)`],
              ['✍️ Strona 3', 'Lista uczestników — Lp. / Imię i nazwisko / Rok urodzenia'],
              [`📅 Strony 4–${3 + campDays}`, `${campDays} ${campDays === 1 ? 'dzień' : 'dni'} obozu · ${planItems.length} elementów w planie dnia`],
            ].map(([page, desc]) => (
              <div key={page} className="flex gap-3 py-1.5 border-b border-gray-100 last:border-0">
                <span className="font-semibold text-gray-700 w-28 shrink-0 text-xs">{page}</span>
                <span className="text-gray-500 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Przycisk generowania */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition shadow ${
            canGenerate
              ? 'bg-green-700 text-white hover:bg-green-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          📥 Generuj dziennik PDF
        </button>
        {!canGenerate && <p className="text-center text-xs text-red-400">Wybierz wychowawcę</p>}
        {canGenerate && planItems.length === 0 && <p className="text-center text-xs text-amber-500">Plan dnia jest pusty — dodaj zajęcia powyżej</p>}
      </div>
    </div>
  )
}
