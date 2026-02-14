export type RegisterStartInput = {
  phone: string
  email?: string
  country?: string
  region?: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ? JSON.stringify(data.error) : 'Request failed')
  return data as T
}

export function registerStartApi(input: RegisterStartInput) {
  return post<{ userId: string; devOtp?: { phoneOtp: string; emailOtp: string } }>('/api/auth/register/start', input)
}

export function verifyRegistrationApi(input: { phone: string; phoneCode: string; emailCode: string }) {
  return post<{ ok: true }>('/api/auth/register/verify', input)
}

export function setPinApi(input: { phone: string; pin: string }) {
  return post<{ ok: true }>('/api/auth/pin/set', input)
}

export function loginApi(input: { phone: string; pin: string }) {
  return post<{ ok: true; user: { id: string; phone: string; email?: string | null; verifiedAt?: string | null } }>('/api/auth/login', input)
}
