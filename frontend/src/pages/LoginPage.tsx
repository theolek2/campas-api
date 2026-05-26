import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { authApi } from "../api/auth"
import { useAuthStore } from "../store/auth"

type Mode = "login" | "register" | "forgot" | "reset"

export default function LoginPage() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())

  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  // Jeśli już zalogowany — idź do dashboardu
  useEffect(() => { if (isLoggedIn) nav("/") }, [isLoggedIn])

  // Obsługa tokenów z URL
  useEffect(() => {
    const verifyToken = params.get("verify")
    const resetToken = params.get("token")
    if (verifyToken) handleVerify(verifyToken)
    if (resetToken) { setMode("reset"); }
  }, [params])

  const handleVerify = async (token: string) => {
    try {
      const res = await authApi.verifyEmail(token)
      setAuth(res.data.token, res.data.user)
      nav("/")
    } catch {
      setError("Link weryfikacyjny jest nieprawidłowy lub wygasł.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(""); setMessage(""); setLoading(true)
    try {
      if (mode === "login") {
        const res = await authApi.login(email, password)
        setAuth(res.data.token, res.data.user)
        nav("/")
      } else if (mode === "register") {
        const res = await authApi.register(email, password, displayName || undefined)
        if ("token" in res.data) {
          setAuth(res.data.token, res.data.user)
          nav("/")
        } else {
          setMessage("Sprawdź email i kliknij link weryfikacyjny.")
        }
      } else if (mode === "forgot") {
        await authApi.forgotPassword(email)
        setMessage("Jeśli konto istnieje, wysłano link resetujący.")
      } else if (mode === "reset") {
        const token = params.get("token") ?? ""
        await authApi.resetPassword(token, password)
        setMessage("Hasło zmienione! Możesz się zalogować.")
        setMode("login")
      }
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Wystąpił błąd.")
    } finally {
      setLoading(false)
    }
  }

  const titles: Record<Mode, string> = {
    login:    "Zaloguj się",
    register: "Utwórz konto",
    forgot:   "Resetuj hasło",
    reset:    "Nowe hasło",
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⛺</div>
          <h1 className="text-2xl font-bold text-gray-900">Campas</h1>
          <p className="text-gray-500 text-sm mt-1">Planowanie obozów harcerskich</p>
        </div>

        <h2 className="text-xl font-semibold mb-6">{titles[mode]}</h2>

        {error   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
        {message && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="label">Imię i nazwisko</label>
              <input className="input" type="text" value={displayName}
                onChange={e => setDisplayName(e.target.value)} placeholder="Jan Kowalski" />
            </div>
          )}

          {mode !== "reset" && (
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} required
                onChange={e => setEmail(e.target.value)} placeholder="jan@example.com" />
            </div>
          )}

          {(mode === "login" || mode === "register" || mode === "reset") && (
            <div>
              <label className="label">{mode === "reset" ? "Nowe hasło" : "Hasło"}</label>
              <input className="input" type="password" value={password} required minLength={6}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Ładowanie..." : titles[mode]}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("register")} className="text-green-600 hover:underline block w-full">
                Nie masz konta? Zarejestruj się
              </button>
              <button onClick={() => setMode("forgot")} className="text-gray-400 hover:underline block w-full">
                Zapomniałem hasła
              </button>
            </>
          )}
          {mode !== "login" && (
            <button onClick={() => setMode("login")} className="text-green-600 hover:underline">
              ← Wróć do logowania
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
