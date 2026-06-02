import { useState } from 'react'

export default function JoinCampFlow({ onClose, onJoined, user, onNeedAuth }) {
  const [code, setCode] = useState('')
  const [campInfo, setCampInfo] = useState(null)
  const [step, setStep] = useState('code') // 'code' | 'confirm' | 'success'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCodeLookup = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(trimmed)}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.detail || 'Nieprawidłowy lub wygasły kod. Sprawdź czy przepisałeś poprawnie.')
        return
      }
      const data = await res.json()
      setCampInfo(data)
      setStep('confirm')
    } catch {
      setError('Błąd połączenia — spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      onNeedAuth(code.trim().toUpperCase())
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('campas_token') || ''
      const res = await fetch(`/api/join/${encodeURIComponent(code.trim().toUpperCase())}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.detail || 'Nie udało się dołączyć do obozu.')
        return
      }
      const data = await res.json()
      setStep('success')
      setTimeout(() => onJoined(data.camp_id), 1500)
    } catch {
      setError('Błąd połączenia — spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="text-2xl">🔑</span>
            <div>
              <div className="font-bold text-lg">Dołącz do obozu</div>
              <div className="text-orange-200 text-xs">Wpisz kod od komendanta</div>
            </div>
          </div>
          <button onClick={onClose} className="text-orange-200 hover:text-white transition text-xl">✕</button>
        </div>

        <div className="p-6">

          {step === 'code' && (
            <>
              <p className="text-gray-600 text-sm mb-4">
                Komendant obozu wygenerował dla Ciebie unikalny kod dostępu. Wpisz go poniżej, żeby dołączyć do obozu.
              </p>
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Kod dołączenia</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest uppercase focus:outline-none focus:border-orange-400 transition"
                  placeholder="WILK2025"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleCodeLookup()}
                  maxLength={12}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-600 text-sm mb-3 text-center">{error}</p>}
              <button
                onClick={handleCodeLookup}
                disabled={loading || !code.trim()}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {loading ? 'Sprawdzam...' : 'Sprawdź kod →'}
              </button>
            </>
          )}

          {step === 'confirm' && campInfo && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="font-bold text-green-800">Kod poprawny!</span>
                </div>
                <p className="text-sm text-gray-700">Dołączasz do obozu:</p>
                <p className="font-bold text-gray-900 text-lg mt-1">{campInfo.camp_name || campInfo.unit_name}</p>
                {campInfo.date_start && (
                  <p className="text-gray-500 text-sm">{campInfo.date_start} — {campInfo.date_end}</p>
                )}
              </div>

              {!user && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-800">
                  ℹ️ Musisz być zalogowany żeby dołączyć. Zaloguj się lub utwórz konto — potem wróć tu z kodem.
                </div>
              )}

              {error && <p className="text-red-600 text-sm mb-3 text-center">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('code'); setCampInfo(null); setError('') }}
                  className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition"
                >
                  ← Wróć
                </button>
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="flex-2 flex-grow bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition px-6"
                >
                  {loading ? 'Dołączam...' : user ? 'Dołącz do obozu' : 'Zaloguj się →'}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🎉</div>
              <div className="font-bold text-xl text-gray-900 mb-2">Dołączyłeś!</div>
              <div className="text-gray-500 text-sm">Przekierowanie do obozu...</div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
