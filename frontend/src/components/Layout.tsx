import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/auth"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const nav = useNavigate()

  const handleLogout = () => {
    logout()
    nav("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-green-700 text-lg">
            ⛺ Campas
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">{user.display_name ?? user.email}</span>
            )}
            <button onClick={handleLogout} className="btn-secondary text-sm py-1">
              Wyloguj
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
