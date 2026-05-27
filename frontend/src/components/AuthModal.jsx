import { useState } from 'react'
import { signIn, signUp, upsertProfile } from '../lib/api'

export default function AuthModal({ onClose, onAuth, resetToken: initResetToken }) {
  const [mode, setMode]         = useState(initResetToken ? 'reset' : 'login')   // 'login' | 'register' | 'guest' | 'reset'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [org, setOrg]           = useState('')
  const [phone, setPhone]       = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [resetToken, setResetToken] = useState(initResetToken || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Reset hasła (link z emaila)
    if (mode === 'reset') {
      try {
        if (password.length < 10) throw new Error('Hasło musi mieć co najmniej 10 znaków')
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/`~]/.test(password)) throw new Error('Hasło musi zawierać znak specjalny')
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Błąd resetowania hasła')
        setError('✅ Hasło zmienione! Możesz się zalogować.')
        setTimeout(() => { setMode('login'); setError(''); setPassword('') }, 2000)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    // Guest login (przyboczny) — wymaga camp_id zapisanego w localStorage
    if (mode === 'guest') {
      try {
        const campId = localStorage.getItem('campas_camp_id') || ''
        if (!campId) throw new Error('Brak wybranego obozu. Zaloguj się jako drużynowy i wybierz obóz.')
        const res = await fetch(`/api/camps/${campId}/team/guest-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || data.error || 'Błąd logowania')
        localStorage.setItem('skauting_external_session', JSON.stringify({
          token: data.session_token,
          camp_id: campId,
          user: data.user,
        }))
        onClose()
        window.location.reload()
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
      return
    }

    // Regular Supabase auth
    try {
      if (mode === 'login') {
        const { data, error: err } = await signIn(email, password)
        if (err) throw err
        onAuth(data.user)
      } else {
        const { data, error: err } = await signUp(email, password, name)
        if (err) throw err
        if (data.needs_verification) {
          setMode('confirm')
          return
        }
        if (data.user) {
          onAuth(data.user)
        }
      }
    } catch (err) {
      setError(err.message || 'Błąd logowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-green-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {mode === 'login' ? '🔐 Zaloguj się' : mode === 'reset' ? '🔑 Nowe hasło' : '📝 Utwórz konto'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl">×</button>
        </div>

        {/* Ekran potwierdzenia email */}
        {mode === 'confirm' && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Sprawdź swoją skrzynkę</h3>
            <p className="text-sm text-gray-600 mb-4">
              Wysłaliśmy link potwierdzający na adres <b>{email}</b>.<br/>
              Kliknij w link w emailu aby aktywować konto.
            </p>
            <p className="text-xs text-gray-400">Po potwierdzeniu wróć tutaj i zaloguj się.</p>
            <button onClick={() => setMode('login')} className="mt-4 text-green-700 text-sm font-semibold hover:underline">
              → Przejdź do logowania
            </button>
          </div>
        )}

        {mode !== 'confirm' && <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="email@harcerze.pl" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{mode === 'reset' ? 'Nowe hasło *' : 'Hasło *'}</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              placeholder="min. 10 znaków, wymagany znak specjalny" minLength={10} />
          </div>

          {mode === 'register' && <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Imię i nazwisko *</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="Jan Kowalski" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Jednostka / hufiec</label>
              <input value={org} onChange={e => setOrg(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="np. 1 DH Kraków" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon kontaktowy</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="+48 000 000 000" maxLength={15} pattern="^(\+?48)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}$" />
            </div>
          </>}

          {error && <p className={`text-sm px-3 py-2 rounded-lg ${error.startsWith('✅') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-700 text-white py-2.5 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50">
            {loading ? 'Proszę czekać...' : mode === 'login' ? 'Zaloguj się' : mode === 'reset' ? 'Ustaw nowe hasło' : 'Utwórz konto'}
          </button>

          {mode !== 'reset' && (
          <p className="text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>Nie masz konta?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-green-700 font-semibold hover:underline">
                  Zarejestruj się
                </button>
              </>
            ) : mode === 'register' ? (
              <>Masz już konto?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-green-700 font-semibold hover:underline">
                  Zaloguj się
                </button>
              </>
            ) : (
              <>Drużynowy?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-green-700 font-semibold hover:underline">
                  Zaloguj się
                </button>
              </>
            )}
          </p>
          <div className="border-t border-gray-100 pt-2 text-center">
            <button type="button" onClick={() => setMode('guest')}
              className={`text-xs font-semibold transition ${mode === 'guest' ? 'text-green-700' : 'text-gray-400 hover:text-green-600'}`}>
              {mode === 'guest' ? '✓ Tryb gościa' : 'Jestem przybocznym (gość) →'}
            </button>
          </div>
          {mode === 'register' && (
            <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
              🔒 Po rejestracji otrzymasz email z linkiem aktywacyjnym.
            </p>
          )}
          )}
        </form>}
      </div>
    </div>
  )
}
