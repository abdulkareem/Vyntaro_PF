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
      throw new Error(
        payload.error
          ? JSON.stringify(payload.error)
          : payload.message || 'Request failed'
      )
    }

    throw new Error(
      typeof data === 'string' && data.trim()
        ? data
        : 'Request failed'
    )
  }

  return data as T
}

/* ---------------- REGISTER ---------------- */

export function registerStartApi(input: RegisterStartInput) {
  return post<{
    userId: string
    devOtp?: { phoneOtp: string; emailOtp: string }
  }>('/api/auth/register/start', input)
}

export function verifyRegistrationApi(input: { phone: string; otp: string }) {
  return post<{
    ok: true
    user?: {
      id: string
      phone: string
      email?: string | null
      verifiedAt?: string | null
      avatarUrl?: string | null
    }
    next?: string
  }>('/api/auth/register/verify', input)
}

/* ---------------- PIN ---------------- */

export function setPinApi(input: { phone: string; pin: string; userId?: string; email?: string }) {
  return post<{ ok: true }>('/api/auth/pin/set', input)
}

export function startPinResetApi(input: { phone?: string; email?: string }) {
  return post<{ ok: true; code?: string; channel?: 'phone' | 'email' }>('/api/auth/pin/reset/start', input)
}

export function verifyPinResetApi(input: { phone?: string; email?: string; otp: string }) {
  return post<{ ok: true }>('/api/auth/pin/reset/verify', input)
}

export function completePinResetApi(input: { phone?: string; email?: string; pin: string }) {
  return post<{ ok: true }>('/api/auth/pin/reset/complete', input)
}

export function updatePinApi(input: { phone: string; oldPin: string; newPin: string }) {
  return post<{ ok: true }>('/api/auth/pin/change', input)
}

/* ---------------- LOGIN ---------------- */

export function loginApi(input: { phone: string; pin: string }) {
  return post<{
    ok: true
    user: {
      id: string
      phone: string
      email?: string | null
      verifiedAt?: string | null
      avatarUrl?: string | null
    }
    next?: string
  }>('/api/auth/login', input)
}

/* ---------------- PROFILE ---------------- */

export function checkIdentityApi(input: { phone: string; email?: string }) {
  return post<{ exists: boolean; phoneExists?: boolean; emailExists?: boolean }>('/api/auth/identity/check', input)
}

export function requestOtpApi(input: { phone?: string; email?: string; purpose: string; resend?: boolean }) {
  return post<{ ok: true; code?: string }>('/api/auth/otp/request', input)
}

export function verifyOtpApi(input: { phone?: string; email?: string; otp: string; purpose: string }) {
  return post<{ ok: true; token?: string }>('/api/auth/otp/verify', input)
}

export function updateProfileApi(input: {
  userId: string
  email?: string
  phone?: string
  avatarUrl?: string
  otpToken: string
}) {
  return post<{
    ok: true
    user: {
      id: string
      phone: string
      email?: string | null
      verifiedAt?: string | null
      avatarUrl?: string | null
    }
  }>('/api/auth/profile/update', input)
}
