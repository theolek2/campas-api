import { useState, useRef, useEffect } from 'react'

export default function CampSwitcher({ camps, currentCampId, onSwitch, onCreateNew, onJoinCamp, onLeaveCamp }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = camps.find(c => c.id === currentCampId) || camps[0]

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!camps.length) return null

  const campLabel = c => {
    if (!c) return 'Wybierz obóz'
    const name = c.unit_name || c.unitName || c.name || 'Obóz'
    const d = c.date_start || c.dateStart
    const year = d ? new Date(d).getFullYear() : ''
    return year ? `${name} ${year}` : name
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white text-sm font-medium max-w-[180px]"
      >
        <span className="truncate">{campLabel(current)}</span>
        <span className="text-white/60 flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Twoje obozy</p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {camps.map(camp => (
              <div key={camp.id} className={`flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition ${camp.id === currentCampId ? 'bg-green-50' : ''}`}>
                <button
                  onClick={() => { onSwitch(camp.id); setOpen(false) }}
                  className="flex-1 text-left flex items-center gap-2 min-w-0"
                >
                  <span className="text-base">🏕️</span>
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${camp.id === currentCampId ? 'text-green-700' : 'text-gray-800'}`}>
                      {campLabel(camp)}
                    </div>
                    {camp.date_start && <div className="text-xs text-gray-400">{camp.date_start}</div>}
                  </div>
                  {camp.id === currentCampId && <span className="text-green-500 flex-shrink-0 ml-auto">✓</span>}
                </button>
                <button
                  onClick={() => { onLeaveCamp(camp.id, campLabel(camp)); setOpen(false) }}
                  className="flex-shrink-0 text-gray-300 hover:text-red-500 transition text-xs px-1"
                  title="Usuń obóz z listy"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100">
            <button
              onClick={() => { onJoinCamp(); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-orange-50 transition text-orange-600 font-semibold text-sm"
            >
              <span>🔑</span> Dołącz do kolejnego obozu
            </button>
            <button
              onClick={() => { onCreateNew(); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition text-green-700 font-semibold text-sm border-t border-gray-100"
            >
              <span>＋</span> Nowy obóz
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
