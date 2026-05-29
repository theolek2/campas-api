import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { campsApi, type Participant } from "../../api/camps"

interface Props { campId: string }

export default function ParticipantsTab({ campId }: Props) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Participant>>({ first_name: "", last_name: "" })

  const { data: participants = [] } = useQuery({
    queryKey: ["participants", campId],
    queryFn: () => campsApi.participants(campId).then(r => r.data),
  })

  const add = useMutation({
    mutationFn: (d: Partial<Participant>) => campsApi.addParticipant(campId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["participants", campId] }); setShowForm(false); setForm({ first_name: "", last_name: "" }) },
  })

  const remove = useMutation({
    mutationFn: (id: string) => campsApi.deleteParticipant(campId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["participants", campId] }),
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500 text-sm">{participants.length} uczestników</p>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Dodaj uczestnika</button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-3">Nowy uczestnik</h3>
          <form onSubmit={e => { e.preventDefault(); add.mutate(form) }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Imię *</label>
                <input className="input" required maxLength={100} value={form.first_name ?? ""}
                  onChange={e => setForm(f => ({...f, first_name: e.target.value}))} />
              </div>
              <div>
                <label className="label">Nazwisko *</label>
                <input className="input" required maxLength={100} value={form.last_name ?? ""}
                  onChange={e => setForm(f => ({...f, last_name: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Data urodzenia</label>
                <input className="input" type="date" max={new Date().toISOString().split('T')[0]} value={form.birth_date as string ?? ""}
                  onChange={e => setForm(f => ({...f, birth_date: e.target.value}))} />
              </div>
              <div>
                <label className="label">PESEL</label>
                <input className="input" maxLength={11} pattern="\d{11}" value={form.pesel ?? ""}
                  onChange={e => setForm(f => ({...f, pesel: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Rodzic / opiekun</label>
                <input className="input" maxLength={200} value={form.parent_name ?? ""}
                  onChange={e => setForm(f => ({...f, parent_name: e.target.value}))} />
              </div>
              <div>
                <label className="label">Telefon do rodzica</label>
                <input className="input" type="tel" maxLength={15} value={form.parent_phone ?? ""}
                  onChange={e => setForm(f => ({...f, parent_phone: e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={add.isPending} className="btn-primary text-sm">
                {add.isPending ? "Dodawanie..." : "Dodaj"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Anuluj</button>
            </div>
          </form>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-3xl mb-2">👥</div>
          Brak uczestników
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4 font-medium">Imię i nazwisko</th>
                <th className="pb-2 pr-4 font-medium">Data ur.</th>
                <th className="pb-2 pr-4 font-medium">Rodzic</th>
                <th className="pb-2 pr-4 font-medium">Tel. rodzica</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {participants.map(p => (
                <tr key={p.id}>
                  <td className="py-2 pr-4 font-medium">{p.first_name} {p.last_name}</td>
                  <td className="py-2 pr-4 text-gray-500">{p.birth_date ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-500">{p.parent_name ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-500">{p.parent_phone ?? "—"}</td>
                  <td className="py-2">
                    <button onClick={() => remove.mutate(p.id)}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
