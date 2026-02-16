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

/* =====================================================
   COMPATIBILITY LAYER (for existing screens)
   ===================================================== */

/**
 * Identity check is not implemented on backend yet.
 * Frontend uses it only for UX hints.
 */
export async function checkIdentityApi(_: { phone: string; email?: string }) {
  return { exists: false }
}

/**
 * OTP resend not implemented yet.
 */
export async function requestOtpApi(_: { phone: string; email?: string; resend?: boolean }) {
  return { ok: true }
}

/**
 * Legacy verifyOtp API → map to register verification
 */
export async function verifyOtpApi(input: { phone: string; otp: string }) {
  return verifyRegistrationApi(input)
}
