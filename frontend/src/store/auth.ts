/**
 * store/auth.ts — globalny stan autoryzacji (Zustand).
 */
import { create } from "zustand"
import type { User } from "../api/auth"

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("token"),
  user: (() => {
    try { return JSON.parse(localStorage.getItem("user") ?? "null") } catch { return null }
  })(),

  setAuth: (token, user) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    set({ token: null, user: null })
  },

  isLoggedIn: () => Boolean(get().token && get().user),
}))
