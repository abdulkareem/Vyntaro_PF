export type RegisterStartInput = {
  phone: string
  email?: string
  country?: string
  region?: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const raw = await res.text()
  let data: unknown = null

  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = raw
    }
  }

  if (!res.ok) {
    if (typeof data === 'object' && data) {
      const payload = data as { error?: unknown; message?: string }
      throw new Error(payload.error ? JSON.stringify(payload.error) : payload.message || 'Request failed')
    }

    throw new Error(typeof data === 'string' && data.trim() ? data : 'Request failed')
  }

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

export function checkIdentityApi(input: { phone: string; email?: string }) {
  return post<{ exists: boolean }>('/api/auth/check-identity', input)
}

export function requestOtpApi(input: { phone: string; email?: string; resend?: boolean }) {
  return post<{ ok: true }>('/api/auth/otp', input)
}

export function verifyOtpApi(input: { phone: string; otp: string }) {
  return post<{ ok?: boolean; profileExists?: boolean; identityExists?: boolean; action?: string; token?: string }>('/api/auth/verify', input)
}
