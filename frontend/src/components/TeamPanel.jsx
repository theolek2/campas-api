import { useState, useEffect } from 'react'
import { getTeamMembers, updateExternalUser } from '../lib/api'

export default function TeamPanel({ user, campId }) {
  const [members, setMembers] = useState([])

  const load = async () => {
    if (!campId) return
    try {
      const data = await getTeamMembers(campId)
      setMembers(data || [])
    } catch {}
  }

  useEffect(() => { load() }, [campId])

  const toggleActive = async (m) => {
    await updateExternalUser(campId, m.id, { active: !m.active })
    load()
  }

  const toggleRobert = async (m) => {
    await updateExternalUser(campId, m.id, { robert_enabled: !m.robert_enabled })
    load()
  }

  const generateLink = async (m) => {
    try {
      const token = localStorage.getItem('campas_token') || ''
      const res = await fetch(`/api/camps/${campId}/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: m.email, name: m.display_name, role: m.role }),
      })
      const data = await res.json()
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
        alert('Link magic skopiowany! Wyślij przybocznemu.\n\n' + data.url)
        load()
      }
    } catch (e) {
      alert('Błąd: ' + e.message)
    }
  }

  const resetPassword = async (m) => {
    if (!confirm(`Zresetować hasło dla ${m.display_name || m.email}?`)) return
    try {
      const token = localStorage.getItem('campas_token') || ''
      const res = await fetch(`/api/camps/${campId}/team/${m.id}/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.password) {
        await navigator.clipboard.writeText(data.password)
        alert(`Nowe hasło (skopiowane): ${data.password}`)
      }
    } catch (e) {
      alert('Błąd: ' + e.message)
    }
  }

  const stats = {
    active: members.filter(m => m.active).length,
    total: members.length,
  }

  if (!campId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-8">
        <p className="text-center">Wybierz obóz aby zarządzać zespołem</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800">👥 Zespół</h3>
            <p className="text-xs text-gray-400">Aktywni: {stats.active} / {stats.total}</p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">👥</div>
            <p>Brak przybocznych</p>
            <p className="text-xs mt-1">Zaproś pierwszego w zakładce Tablica</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${m.active ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                <div className={`w-3 h-3 rounded-full shrink-0 ${m.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-800 truncate">{m.display_name || m.email}</div>
                  <div className="text-xs text-gray-400">{m.email}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => resetPassword(m)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50" title="Reset hasła">
                    🔑
                  </button>
                  <button onClick={() => generateLink(m)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50" title="Generuj nowy magic link">
                    🔗
                  </button>
                  <button onClick={() => toggleRobert(m)}
                    className={`text-xs rounded-lg px-2 py-1 transition ${m.robert_enabled ? 'bg-green-100 text-green-700 border border-green-300' : 'border border-gray-200 text-gray-300'}`}
                    title="Robert AI">
                    🤖
                  </button>
                  <button onClick={() => toggleActive(m)}
                    className={`text-xs rounded-lg px-2.5 py-1 font-semibold transition ${
                      m.active ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                    }`}>
                    {m.active ? 'Dezaktywuj' : 'Aktywuj'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
