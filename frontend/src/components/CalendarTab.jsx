import { useState, useEffect } from 'react'
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getTasks } from '../lib/api'

const MONTHS = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']
const DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd']

export default function CalendarTab({ user, meta, campId }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [events, setEvents] = useState([])
  const [taskEvents, setTaskEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [editEvent, setEditEvent] = useState(null)

  const load = async () => {
    if (!campId) return
    const ev = await getCalendarEvents({ campId })
    setEvents(ev)
    const tasks = await getTasks({ campId })
    setTaskEvents(tasks.filter(t => t.deadline))
  }

  useEffect(() => { load() }, [year, month, campId])

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  const allDays = []
  for (let i = 0; i < startDow; i++) allDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) allDays.push(d)

  const today = new Date()
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const dayEvents = (d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const cal = events.filter(e => e.date_start === dateStr || (e.date_end && dateStr >= e.date_start && dateStr <= e.date_end))
    const tasks = taskEvents.filter(t => t.deadline?.startsWith(dateStr))
    return [...cal.map(e => ({ ...e, type: 'event' })), ...tasks.map(t => ({ ...t, type: 'task', title: t.title, color: '#f97316' }))]
  }

  const handleAdd = async () => {
    const title = prompt('Tytuł wydarzenia:')
    if (!title || !selectedDate || !campId) return
    await createCalendarEvent(campId, {
      title,
      date_start: selectedDate,
      created_by: user?.id,
    })
    setSelectedDate(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Usunąć wydarzenie?')) return
    await deleteCalendarEvent(campId, id)
    load()
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Kalendarz */}
      <div className="flex-1 overflow-y-auto bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)}
            className="text-lg font-bold text-green-700 hover:text-green-900 px-2">←</button>
          <h2 className="font-bold text-gray-800">{MONTHS[month]} {year}</h2>
          <button onClick={() => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)}
            className="text-lg font-bold text-green-700 hover:text-green-900 px-2">→</button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden">
          {DAYS.map(d => <div key={d} className="bg-green-800 text-white text-xs text-center py-1.5 font-semibold">{d}</div>)}
          {allDays.map((d, i) => {
            if (!d) return <div key={`e${i}`} className="bg-gray-50 min-h-[80px]" />
            const evs = dayEvents(d)
            return (
              <div key={d}
                onClick={() => setSelectedDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)}
                className={`bg-white min-h-[80px] p-0.5 cursor-pointer hover:bg-green-50 transition border-t border-gray-100 ${
                  isToday(d) ? 'ring-2 ring-green-500 ring-inset' : ''}`}
              >
                <div className={`text-xs font-semibold mb-0.5 px-0.5 ${isToday(d) ? 'text-green-700' : 'text-gray-600'}`}>{d}</div>
                <div className="space-y-0.5">
                  {evs.slice(0, 3).map((e, j) => (
                    <div key={j} className="text-[9px] px-1 py-0.5 rounded truncate text-white"
                      style={{ background: e.color || '#2d6a2d' }}
                      onClick={e => { e.stopPropagation(); if (e.type === 'event') setEditEvent(e) }}>
                      {e.title}
                    </div>
                  ))}
                  {evs.length > 3 && <div className="text-[9px] text-gray-400 px-1">+{evs.length - 3} więcej</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Panel boczny */}
      {selectedDate && (
        <div className="w-64 bg-white border-l border-gray-200 p-4 shrink-0 overflow-y-auto">
          <h3 className="font-bold text-sm text-gray-800 mb-3">
            📅 {new Date(selectedDate).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="space-y-2 mb-4">
            {dayEvents(parseInt(selectedDate.split('-')[2])).map((e, i) => (
              <div key={i} className="text-xs border rounded-lg px-2.5 py-1.5 flex items-center justify-between"
                style={{ borderColor: e.color || '#2d6a2d', background: (e.color || '#2d6a2d') + '10' }}>
                <span>{e.type === 'task' ? '📋' : '📅'} {e.title}</span>
                {e.type === 'event' && <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-500 ml-1">×</button>}
              </div>
            ))}
          </div>
          <button onClick={handleAdd}
            className="w-full bg-green-700 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-800">
            + Dodaj wydarzenie
          </button>
        </div>
      )}
    </div>
  )
}
