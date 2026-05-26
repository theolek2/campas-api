import { useState, useMemo } from 'react'
import { getShoppingList, generateCompactShoppingPdf } from '../utils/generateJadlospis.js'

// ── Pomocnicze ────────────────────────────────────────────────────────────────

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000)
}

function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(t) {
  return t || '—:——'
}

// ── Karta slotu ───────────────────────────────────────────────────────────────
function SlotCard({ slot, color = '#2d6a2d' }) {
  return (
    <div className="flex gap-3 items-start py-3 border-b border-gray-100 last:border-0">
      <div className="text-xs font-mono text-gray-500 w-12 shrink-0 mt-0.5">{formatTime(slot.time)}</div>
      <div className="w-1 rounded-full shrink-0 self-stretch" style={{ background: color, minHeight: 20 }} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900">{slot.name || '—'}</div>
        {slot.description && <div className="text-xs text-gray-500 mt-0.5">{slot.description}</div>}
      </div>
    </div>
  )
}

// ── Plan jednego dnia ─────────────────────────────────────────────────────────
function DayPlanView({ day, dayNumber, date }) {
  const sorted = [...(day?.slots || [])].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const getColor = (time) => {
    if (!time) return '#9ca3af'
    const h = parseInt(time.split(':')[0])
    if (h < 10) return '#f59e0b'   // rano — żółty
    if (h < 14) return '#22c55e'   // południe — zielony
    if (h < 18) return '#3b82f6'   // popołudnie — niebieski
    return '#8b5cf6'               // wieczór — fioletowy
  }

  return (
    <div>
      <div className="text-xs text-gray-400 mb-3">
        <span className="inline-flex gap-2 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>Rano</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Południe</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Popołudnie</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"/>Wieczór</span>
        </span>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Brak zajęć w tym dniu</div>
      ) : sorted.map(slot => (
        <SlotCard key={slot.id} slot={slot} color={getColor(slot.time)} />
      ))}
    </div>
  )
}

// ── Główny komponent ──────────────────────────────────────────────────────────
export default function DuringCampTab({ meta, days }) {
  const [view, setView] = useState('today')      // 'today' | 'calendar' | 'shopping'
  const [selectedDay, setSelectedDay] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const campStart = meta.date_start || null
  const campEnd   = meta.date_end   || null

  const campDayIndex = useMemo(() => {
    if (!campStart) return null
    const d = daysBetween(campStart, today)
    return d >= 0 ? d : null
  }, [campStart, today])

  const totalDays = campStart && campEnd ? daysBetween(campStart, campEnd) + 1 : days.length

  const currentDay = days[campDayIndex] || null

  // Czy obóz aktywny?
  const campActive = campStart && campEnd && today >= campStart && today <= campEnd
  const campFuture = campStart && today < campStart
  const campEnded  = campEnd && today > campEnd

  // Lista dni z datami
  const campDays = useMemo(() => {
    return days.map((day, i) => ({
      ...day,
      date: campStart ? addDays(campStart, i) : null,
      dayNumber: i + 1,
    }))
  }, [days, campStart])

  const displayDay = selectedDay !== null ? days[selectedDay] : currentDay
  const displayDayNumber = selectedDay !== null ? selectedDay + 1 : (campDayIndex !== null ? campDayIndex + 1 : 1)
  const displayDate = selectedDay !== null && campStart ? addDays(campStart, selectedDay) : (campStart ? addDays(campStart, campDayIndex || 0) : null)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

      {/* Sub-nav */}
      <div className="bg-green-800 flex shrink-0">
        {[['today','📅 Dziś'], ['calendar','📆 Kalendarz'], ['shopping','🛒 Zakupy']].map(([v, l]) => (
          <button key={v} onClick={() => { setView(v); if (v === 'today') setSelectedDay(null) }}
            className={`flex-1 py-2 text-sm font-semibold transition ${
              view === v ? 'bg-white text-green-800' : 'text-green-300 hover:text-white'
            }`}>{l}</button>
        ))}
      </div>

      {/* Stan obozu */}
      {campFuture && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 text-center">
          ⏳ Obóz startuje {formatDate(campStart)} · zostało {daysBetween(today, campStart)} dni
        </div>
      )}
      {campEnded && (
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 text-sm text-gray-600 text-center">
          ✅ Obóz zakończył się {formatDate(campEnd)}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">

        {/* ── WIDOK: Dziś ── */}
        {view === 'today' && (
          <div className="max-w-lg mx-auto p-4">
            {/* Nagłówek dnia */}
            <div className="bg-green-700 text-white rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-green-300 text-sm">
                  {campActive ? 'Trwa obóz' : campFuture ? 'Przed obozem' : 'Po obozie'}
                </span>
                {campActive && campDayIndex !== null && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    Dzień {campDayIndex + 1} z {totalDays}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold">
                {campActive ? formatDate(today) : (campStart ? formatDate(campStart) : 'Brak dat obozu')}
              </h2>
              {campActive && (
                <div className="mt-2 bg-white/10 rounded-lg px-3 py-1.5 text-sm">
                  Pozostało dni: <b>{daysBetween(today, campEnd)}</b>
                </div>
              )}
            </div>

            {/* Plan dnia */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="font-bold text-gray-800 mb-3">
                Plan dnia {displayDayNumber}
                {displayDate && <span className="text-gray-400 font-normal text-sm ml-2">{formatDate(displayDate)}</span>}
              </h3>
              <DayPlanView day={displayDay} dayNumber={displayDayNumber} date={displayDate} />
            </div>

            {/* Przełącznik dni */}
            {days.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {campDays.map((d, i) => (
                  <button key={d.id} onClick={() => { setSelectedDay(i); setView('today') }}
                    className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      (selectedDay === null ? campDayIndex === i : selectedDay === i)
                        ? 'bg-green-700 text-white border-green-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-green-400'
                    }`}>
                    Dzień {i + 1}
                    {d.date && <div className="font-normal opacity-70">
                      {new Date(d.date).toLocaleDateString('pl-PL',{day:'numeric',month:'short'})}
                    </div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WIDOK: Kalendarz ── */}
        {view === 'calendar' && (
          <div className="max-w-lg mx-auto p-4">
            {days.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">📆</div>
                <p className="font-semibold">Brak planu zajęć</p>
                <p className="text-sm mt-1">Utwórz plan w zakładce "Plan zajęć"</p>
              </div>
            ) : campDays.map((day, i) => {
              const isToday = day.date === today
              const isPast  = day.date && day.date < today
              const slots   = day.slots || []
              return (
                <button key={day.id}
                  onClick={() => { setSelectedDay(i); setView('today') }}
                  className={`w-full text-left mb-3 rounded-2xl border-2 p-4 transition ${
                    isToday ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-400'
                  } ${isPast ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className={`font-bold text-sm ${isToday ? 'text-green-800' : 'text-gray-800'}`}>
                        Dzień {i + 1}{day.label ? ` — ${day.label}` : ''}
                      </span>
                      {isToday && <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Dziś</span>}
                    </div>
                    {day.date && (
                      <span className="text-xs text-gray-400">{formatDate(day.date)}</span>
                    )}
                  </div>
                  {slots.length > 0 ? (
                    <div className="space-y-1">
                      {[...slots].sort((a,b) => (a.time||'').localeCompare(b.time||'')).slice(0,3).map(s => (
                        <div key={s.id} className="text-xs text-gray-600 flex gap-2">
                          <span className="font-mono w-10 text-gray-400">{s.time || '--:--'}</span>
                          <span className="truncate">{s.name}</span>
                        </div>
                      ))}
                      {slots.length > 3 && (
                        <div className="text-xs text-gray-400">+{slots.length - 3} więcej...</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Brak zajęć</div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Lista zakupów (2-dniowe okna) */}
        {view === 'shopping' && (() => {
          const windows = campStart ? getShoppingList(days, campStart) : []
          return (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-800">🛒 Lista zakupów</h3>
                <button onClick={() => generateCompactShoppingPdf(days, meta)}
                  className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-800">
                  📥 PDF (A4)
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">Agregacja składników z jadłospisu, grupowana co 2 dni</p>
              {windows.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">🛒</div>
                  <p className="font-semibold">Brak składników w jadłospisie</p>
                  <p className="text-xs mt-1">Dodaj posiłki ze składnikami w zakładce Jadłospis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {windows.map((w, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-orange-500 text-white px-4 py-2 font-bold text-sm">{w.label}</div>
                      <div className="p-3">
                        {w.items.length === 0 ? (
                          <p className="text-xs text-gray-400 py-2">Brak składników</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                            {w.items.map((it, j) => (
                              <div key={j} className="flex items-center gap-2 text-sm py-0.5">
                                <input type="checkbox" className="accent-orange-500 w-4 h-4" />
                                <span className="text-gray-700">{it.name}</span>
                                <span className="text-gray-400 text-xs ml-auto">×{it.qty}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
