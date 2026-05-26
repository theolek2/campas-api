import { api } from "./client"

export interface User {
  id: string
  email: string
  role: string
  display_name: string | null
}

export interface AuthResponse {
  token: string
  user: User
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", { email, password }),

  register: (email: string, password: string, display_name?: string, invite_token?: string) =>
    api.post<AuthResponse>("/api/auth/register", { email, password, display_name, invite_token }),

  forgotPassword: (email: string) =>
    api.post("/api/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    api.post("/api/auth/reset-password", { token, password }),

  verifyEmail: (token: string) =>
    api.get<AuthResponse>(`/api/auth/verify-email?token=${token}`),

  inviteInfo: (token: string) =>
    api.get(`/api/auth/invite-info?token=${token}`),
}
