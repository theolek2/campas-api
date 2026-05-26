import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { campsApi, type PlanItem, type Camp } from "../../api/camps"

const CATEGORIES = ["zajęcia", "posiłek", "zbiórka", "transport", "cisza nocna", "inne"]

interface Props { campId: string; camp: Camp }

export default function PlanningTab({ campId, camp }: Props) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<PlanItem>>({ title: "", day_date: "", time_start: "", time_end: "", category: "", description: "" })

  const { data: items = [] } = useQuery({
    queryKey: ["planning", campId],
    queryFn: () => campsApi.planning(campId).then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (d: Partial<PlanItem>) => campsApi.createPlanItem(campId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["planning", campId] }); setShowForm(false); setForm({ title: "" }) },
  })

  const remove = useMutation({
    mutationFn: (id: string) => campsApi.deletePlanItem(campId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["planning", campId] }),
  })

  // Grupuj po dniu
  const grouped = items.reduce<Record<string, PlanItem[]>>((acc, item) => {
    const day = item.day_date ?? "Bez daty"
    if (!acc[day]) acc[day] = []
    acc[day].push(item)
    return acc
  }, {})

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500 text-sm">{items.length} punktów planu</p>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Dodaj punkt</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-3">Nowy punkt planu</h3>
          <form onSubmit={e => { e.preventDefault(); create.mutate(form) }} className="space-y-3">
            <div>
              <label className="label">Tytuł *</label>
              <input className="input" required value={form.title ?? ""}
                onChange={e => setForm(f => ({...f, title: e.target.value}))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Data</label>
                <input className="input" type="date" value={form.day_date ?? ""}
                  min={camp.date_start} max={camp.date_end}
                  onChange={e => setForm(f => ({...f, day_date: e.target.value}))} />
              </div>
              <div>
                <label className="label">Od</label>
                <input className="input" type="time" value={form.time_start ?? ""}
                  onChange={e => setForm(f => ({...f, time_start: e.target.value}))} />
              </div>
              <div>
                <label className="label">Do</label>
                <input className="input" type="time" value={form.time_end ?? ""}
                  onChange={e => setForm(f => ({...f, time_end: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="label">Kategoria</label>
              <select className="input" value={form.category ?? ""}
                onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                <option value="">— wybierz —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Opis</label>
              <textarea className="input" rows={2} value={form.description ?? ""}
                onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={create.isPending} className="btn-primary text-sm">
                {create.isPending ? "Dodawanie..." : "Dodaj"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Anuluj</button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-3xl mb-2">📅</div>
          Brak punktów w harmonogramie
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort().map(([day, dayItems]) => (
            <div key={day}>
              <h3 className="font-semibold text-gray-700 mb-2 pb-1 border-b">{day}</h3>
              <div className="space-y-2">
                {dayItems.map(item => (
                  <div key={item.id} className="card py-3 px-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {item.time_start && (
                          <span className="text-xs text-gray-400 font-mono">
                            {item.time_start}{item.time_end ? `–${item.time_end}` : ""}
                          </span>
                        )}
                        {item.category && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{item.category}</span>
                        )}
                        <span className="font-medium">{item.title}</span>
                      </div>
                      {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                    </div>
                    <button onClick={() => remove.mutate(item.id)}
                      className="text-gray-300 hover:text-red-400 ml-4 text-lg leading-none flex-shrink-0">×</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
