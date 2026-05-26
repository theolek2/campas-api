import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { campsApi, type Camp } from "../api/camps"
import Layout from "../components/Layout"

export default function DashboardPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ unit_name: "", date_start: "", date_end: "" })
  const [error, setError] = useState("")

  const { data: camps = [], isLoading } = useQuery({
    queryKey: ["camps"],
    queryFn: () => campsApi.list().then(r => r.data),
  })

  const createCamp = useMutation({
    mutationFn: (data: Partial<Camp>) => campsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["camps"] }); setShowCreate(false); setForm({ unit_name: "", date_start: "", date_end: "" }) },
    onError: (err: any) => setError(err.response?.data?.detail ?? "Błąd tworzenia obozu"),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    createCamp.mutate(form)
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Twoje obozy</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Nowy obóz
        </button>
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Nowy obóz</h2>
          {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="label">Nazwa jednostki</label>
              <input className="input" value={form.unit_name}
                onChange={e => setForm(f => ({...f, unit_name: e.target.value}))}
                placeholder="np. 3 Drużyna Harcerska" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Data początkowa</label>
                <input className="input" type="date" required value={form.date_start}
                  onChange={e => setForm(f => ({...f, date_start: e.target.value}))} />
              </div>
              <div>
                <label className="label">Data końcowa</label>
                <input className="input" type="date" required value={form.date_end}
                  onChange={e => setForm(f => ({...f, date_end: e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={createCamp.isPending} className="btn-primary">
                {createCamp.isPending ? "Tworzenie..." : "Utwórz"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Anuluj</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Ładowanie...</div>
      ) : camps.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">⛺</div>
          <p className="text-gray-500">Nie masz jeszcze żadnych obozów.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">
            Utwórz pierwszy obóz
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {camps.map(camp => (
            <Link key={camp.id} to={`/camps/${camp.id}`}
              className="card hover:shadow-md transition-shadow cursor-pointer block">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {camp.unit_name ?? "Obóz bez nazwy"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {camp.date_start} — {camp.date_end}
                  </p>
                </div>
                <span className="text-2xl">⛺</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}
