import { getAdminToken } from './adminAuth'
import { requestJson } from './api/httpClient'

type ApiEnvelope<T> = { ok?: boolean; data?: T; error?: { message?: string }; message?: string }

function unwrapPayload<T>(payload: T | ApiEnvelope<T>): T {
  if (!payload || typeof payload !== 'object') return payload as T
  if (!('data' in payload) && !('ok' in payload)) return payload as T

  const typed = payload as ApiEnvelope<T>
  if (typed.ok === false) {
    throw new Error(typed.error?.message || typed.message || 'Admin request failed')
  }

  if (typeof typed.data === 'undefined') {
    throw new Error('Admin response payload is missing data')
  }

  return typed.data
}

async function request<T>(path: string, init: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown } = {}) {
  const payload = await requestJson<T | ApiEnvelope<T>>(`/api/admin${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    authToken: getAdminToken() || undefined
  })

  return unwrapPayload(payload)
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
    return request<{ token: string; profile?: { name?: string; role?: 'ADMIN' | 'SUPER_ADMIN' } }>('/login', { method: 'POST', body: payload })
  },
  listUsers() { return request<AdminUser[]>('/users') },
  updateUser(userId: string, payload: Partial<Pick<AdminUser, 'name' | 'email' | 'isActive'>>) {
    return request<AdminUser>(`/users/${userId}`, { method: 'PATCH', body: payload })
  },
  resetPin(userId: string, pin: string) {
    return request<{ message: string }>(`/users/${userId}/reset-pin`, { method: 'PATCH', body: { pin } })
  },
  deleteUser(userId: string) {
    return request<void>(`/users/${userId}`, { method: 'DELETE' })
  },
  listTables() {
    return request<{ users: unknown[]; pinResetTokens: unknown[]; appSettings: unknown[] }>('/tables')
  },
  upsertSetting(payload: { key: string; value: unknown }) {
    return request<{ key: string; value: unknown }>('/settings', { method: 'PUT', body: payload })
  }
}
