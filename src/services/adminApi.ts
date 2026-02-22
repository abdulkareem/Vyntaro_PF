import { getAdminToken } from './adminAuth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

type ApiEnvelope<T> = { ok: boolean; data: T; error?: { message?: string } }

async function request<T>(path: string, init: RequestInit = {}) {
  const token = getAdminToken()
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  })

  if (res.status === 204) return null as T
  const payload = await res.json() as ApiEnvelope<T>
  if (!res.ok || payload.ok === false) {
    throw new Error(payload.error?.message || 'Admin request failed')
  }
  return payload.data
}

export type AdminUser = {
  id: string
  name: string
  email: string
  mobile: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const adminService = {
  login(payload: { mobile: string; pin: string }) {
    return request<{ token: string }>('/login', { method: 'POST', body: JSON.stringify(payload) })
  },
  listUsers() { return request<AdminUser[]>('/users') },
  updateUser(userId: string, payload: Partial<Pick<AdminUser, 'name' | 'email' | 'isActive'>>) {
    return request<AdminUser>(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) })
  },
  resetPin(userId: string, pin: string) {
    return request<{ message: string }>(`/users/${userId}/reset-pin`, { method: 'PATCH', body: JSON.stringify({ pin }) })
  },
  deleteUser(userId: string) {
    return request<void>(`/users/${userId}`, { method: 'DELETE' })
  },
  listTables() {
    return request<{ users: unknown[]; pinResetTokens: unknown[]; appSettings: unknown[] }>('/tables')
  },
  upsertSetting(payload: { key: string; value: unknown }) {
    return request<{ key: string; value: unknown }>('/settings', { method: 'PUT', body: JSON.stringify(payload) })
  }
}
