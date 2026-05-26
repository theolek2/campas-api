/**
 * api/client.ts — centralny klient axios.
 * Token JWT jest automatycznie dołączany do każdego żądania.
 */
import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL ?? ""

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

// Dołącz JWT z localStorage do każdego żądania
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Przy 401 wyczyść sesję
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)
