import { api } from "./client"

export interface Camp {
  id: string
  unit_name: string | null
  date_start: string
  date_end: string
  terrain_id: string | null
  created_at: string | null
}

export interface Patrol {
  id: string
  camp_id: string | null
  patrol_name: string | null
  people_number: number | null
}

export interface PlanItem {
  id: string
  camp_id: string
  day_date: string | null
  time_start: string | null
  time_end: string | null
  title: string
  description: string | null
  category: string | null
  patrol_id: string | null
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  camp_id: string
  patrol_id: string | null
  first_name: string
  last_name: string
  birth_date: string | null
  pesel: string | null
  parent_name: string | null
  parent_phone: string | null
  notes: string | null
}

export const campsApi = {
  list:   ()          => api.get<Camp[]>("/api/camps"),
  get:    (id: string) => api.get<Camp>(`/api/camps/${id}`),
  create: (data: Partial<Camp>) => api.post<Camp>("/api/camps", data),
  update: (id: string, data: Partial<Camp>) => api.patch<Camp>(`/api/camps/${id}`, data),

  patrols:      (campId: string) => api.get<Patrol[]>(`/api/camps/${campId}/patrols`),
  createPatrol: (campId: string, data: Partial<Patrol>) => api.post<Patrol>(`/api/camps/${campId}/patrols`, data),

  members:      (campId: string) => api.get(`/api/camps/${campId}/members`),

  invite:       (campId: string, type: "multi" | "single", email?: string) =>
    api.post(`/api/camps/${campId}/invite`, { type, email }),

  planning:          (campId: string) => api.get<PlanItem[]>(`/api/camps/${campId}/planning`),
  createPlanItem:    (campId: string, data: Partial<PlanItem>) => api.post<PlanItem>(`/api/camps/${campId}/planning`, data),
  updatePlanItem:    (campId: string, id: string, data: Partial<PlanItem>) => api.patch<PlanItem>(`/api/camps/${campId}/planning/${id}`, data),
  deletePlanItem:    (campId: string, id: string) => api.delete(`/api/camps/${campId}/planning/${id}`),

  participants:      (campId: string) => api.get<Participant[]>(`/api/camps/${campId}/participants`),
  addParticipant:    (campId: string, data: Partial<Participant>) => api.post<Participant>(`/api/camps/${campId}/participants`, data),
  updateParticipant: (campId: string, id: string, data: Partial<Participant>) => api.patch<Participant>(`/api/camps/${campId}/participants/${id}`, data),
  deleteParticipant: (campId: string, id: string) => api.delete(`/api/camps/${campId}/participants/${id}`),
}
