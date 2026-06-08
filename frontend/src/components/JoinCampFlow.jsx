import { useState } from 'react'

export default function JoinCampFlow({ onClose, onJoined }) {
  const [code, setCode] = useState('')
  const [campInfo, setCampInfo] = useState(null)
  const [step, setStep] = useState('code') // 'code' | 'register' | 'success'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleCodeLookup = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(trimmed)}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.detail || 'Nieprawidłowy lub wygasły kod.')
        return
      }
      const data = await res.json()
      setCampInfo(data)
      setStep('register')
    } catch {
      setError('Błąd połączenia.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Podaj imię, nazwisko i adres email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(code.trim().toUpperCase())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name.trim(), email: email.trim() }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.detail || 'Nie udało się dołączyć.')
        return
      }
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('campas_token', data.token)
        localStorage.setItem('campas_user', JSON.stringify(data.user))
        localStorage.setItem('campas_camp_id', data.camp_id)
      }
      setStep('success')
      setTimeout(() => onJoined(data.camp_id), 1500)
    } catch {
      setError('Błąd połączenia.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

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
                Komendant obozu wygenerował dla Ciebie kod dostępu. Wpisz go poniżej.
              </p>
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Kod dołączenia</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest uppercase focus:outline-none focus:border-orange-400 transition"
                  placeholder="XXXXXXXX"
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

          {step === 'register' && campInfo && (
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

              <p className="text-sm text-gray-600 mb-4">Podaj swoje dane, aby utworzyć konto i dołączyć:</p>

              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Imię i nazwisko</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition"
                  placeholder="Jan Kowalski"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Email</label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition"
                  type="email"
                  placeholder="jan@kowalski.pl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  maxLength={200}
                />
              </div>

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
                  disabled={loading || !name.trim() || !email.trim()}
                  className="flex-[2] bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition px-6"
                >
                  {loading ? 'Dołączam...' : 'Dołącz do obozu'}
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
