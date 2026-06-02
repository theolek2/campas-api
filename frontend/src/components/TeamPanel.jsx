import { useState, useEffect } from 'react'
import { getTeamMembers, updateExternalUser, generateJoinCode, refreshJoinCode } from '../lib/api'

export default function TeamPanel({ user, campId }) {
  const [members, setMembers] = useState([])
  const [joinCode, setJoinCode] = useState(null)
  const [codeLoading, setCodeLoading] = useState(false)

  const load = async () => {
    if (!campId) return
    try {
      const data = await getTeamMembers(campId)
      setMembers(data || [])
    } catch {}
  }

  const loadCode = async () => {
    if (!campId) return
    setCodeLoading(true)
    try {
      const data = await generateJoinCode(campId)
      setJoinCode(data)
    } catch {}
    finally { setCodeLoading(false) }
  }

  const handleRefreshCode = async () => {
    if (!confirm('Wygenerować nowy kod? Stary przestanie działać.')) return
    setCodeLoading(true)
    try {
      const data = await refreshJoinCode(campId)
      setJoinCode(data)
    } catch {}
    finally { setCodeLoading(false) }
  }

  useEffect(() => { load(); loadCode() }, [campId])

  const toggleActive = async (m) => {
    await updateExternalUser(campId, m.id, { active: !m.active })
    load()
  }

  const toggleRobert = async (m) => {
    await updateExternalUser(campId, m.id, { robert_enabled: !m.robert_enabled })
    load()
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

  const copyCode = () => {
    if (!joinCode?.code) return
    navigator.clipboard.writeText(joinCode.code).catch(() => {})
  }

  const daysLeft = joinCode?.expires_at
    ? Math.max(0, Math.ceil((new Date(joinCode.expires_at) - Date.now()) / 86400000))
    : 0

  if (!campId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-8">
        <p className="text-center">Wybierz obóz aby zarządzać zespołem</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Kod dołączenia */}
        <div className="bg-white rounded-2xl border border-orange-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-800">🔑 Kod dołączenia</h3>
              <p className="text-xs text-gray-400">Prześlij ten kod nowemu przybocznemu — wpisze go na app.campas.pl</p>
            </div>
          </div>

          {codeLoading ? (
            <div className="text-center py-4 text-gray-400 text-sm">Generowanie kodu...</div>
          ) : joinCode ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  onClick={copyCode}
                  className="flex-1 bg-orange-50 border-2 border-orange-300 rounded-xl px-5 py-3 text-center text-3xl font-mono font-bold tracking-widest text-orange-700 cursor-pointer hover:bg-orange-100 transition select-all"
                  title="Kliknij aby skopiować"
                >
                  {joinCode.code}
                </div>
                <button
                  onClick={copyCode}
                  className="text-xs text-orange-600 border border-orange-200 rounded-lg px-3 py-2 hover:bg-orange-50 transition"
                >
                  📋 Kopiuj
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Ważny jeszcze {daysLeft} {daysLeft === 1 ? 'dzień' : 'dni'} · Użyto: {joinCode.uses || 0}×</span>
                <button onClick={handleRefreshCode} className="text-orange-600 hover:text-orange-700 font-medium">
                  🔄 Nowy kod
                </button>
              </div>
            </div>
          ) : (
            <button onClick={loadCode} className="w-full bg-orange-600 text-white py-2 rounded-xl font-semibold text-sm hover:bg-orange-700 transition">
              Generuj kod dołączenia
            </button>
          )}
        </div>

        {/* Lista przybocznych (stary system — zewnętrzni użytkownicy) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-800">👥 Przyboczni</h3>
              <p className="text-xs text-gray-400">Aktywni: {members.filter(m => m.active).length} / {members.length}</p>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm">Brak przybocznych</p>
              <p className="text-xs mt-1">Udostępnij kod powyżej pierwszemu przybocznemu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${m.active ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                  <div className={`w-3 h-3 rounded-full shrink-0 ${m.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">{m.display_name || m.email}</div>
                    <div className="text-xs text-gray-400">{m.email || m.role}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => resetPassword(m)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50" title="Reset hasła">
                      🔑
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
    </div>
  )
}
