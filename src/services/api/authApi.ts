import { API_BASE_URL, assertApiBaseConfigured, canUseSameOriginFallback } from './baseUrl'

export type RegisterStartInput = {
  phone: string
  mobile?: string
  email?: string
  country?: string
  region?: string
  deliveryChannels?: Array<'phone' | 'email'>
  sendOtpToPhone?: boolean
  sendOtpToEmail?: boolean
}

function getApiBaseCandidates() {
  assertApiBaseConfigured()

  const candidates = [API_BASE_URL]

  if (canUseSameOriginFallback()) {
    candidates.push('')
  }

  return Array.from(new Set(candidates.map(base => base.replace(/\/$/, ''))))
}


function withTimeout(ms: number) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), ms)
  return { controller, timeoutId }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let lastError: unknown
  const bases = getApiBaseCandidates()

  for (const base of bases) {
    const requestPath = `${base}${path}`
    try {
      const { controller, timeoutId } = withTimeout(15000)
      const res = await fetch(requestPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        mode: 'cors',
        signal: controller.signal
      }).finally(() => window.clearTimeout(timeoutId))

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
          const payload = data as {
            error?: unknown
            message?: string
            fieldErrors?: Record<string, string[] | string>
            formErrors?: string[]
          }

          if (payload.fieldErrors && typeof payload.fieldErrors === 'object') {
            const firstFieldErrorEntry = Object.entries(payload.fieldErrors).find(([, value]) => {
              if (Array.isArray(value)) return Boolean(value.find(Boolean))
              return Boolean(value)
            })

            if (firstFieldErrorEntry) {
              const [field, value] = firstFieldErrorEntry
              const message = Array.isArray(value) ? value.find(Boolean) : value
              throw new Error(`${field}: ${String(message)}`)
            }
          }

          if (Array.isArray(payload.formErrors) && payload.formErrors.length > 0) {
            throw new Error(String(payload.formErrors[0]))
          }

          throw new Error(payload.error ? JSON.stringify(payload.error) : payload.message || 'Request failed')
        }

        throw new Error(
          typeof data === 'string' && data.trim()
            ? data
            : 'Request failed'
        )
      }

      return data as T
    } catch (error) {
      lastError = error
      const isLastCandidate = base === bases[bases.length - 1]

      const isAbortError = error instanceof DOMException && error.name === 'AbortError'
      if (isAbortError) {
        throw new Error(`Request timed out after 15s: ${requestPath}`)
      }

      if (!isLastCandidate && error instanceof TypeError) {
        continue
      }

      if (error instanceof TypeError) {
        throw new Error(`Network/CORS error while reaching ${requestPath}. Verify VITE_API_BASE_URL and backend CORS allowlist for your Cloudflare domain.`)
      }

      throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed')
}

function isMissingRouteError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('cannot post') || message.includes('not found') || message.includes('404')
}

async function postWithFallback<T>(paths: string[], body: unknown): Promise<T> {
  let lastError: unknown

  for (const [index, path] of paths.entries()) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[api] trying endpoint', { path, apiBase: API_BASE_URL || '(same-origin)' })
    }

    try {
      return await post<T>(path, body)
    } catch (error) {
      lastError = error
      const isLastPath = index === paths.length - 1
      if (isLastPath || !isMissingRouteError(error)) throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed')
}

/* ---------------- REGISTER ---------------- */

export function registerStartApi(input: RegisterStartInput) {
  const normalizedPhone = input.phone || input.mobile

  if (!normalizedPhone) {
    throw new Error('Phone number is required to start registration')
  }

  return postWithFallback<{
    userId: string
    devOtp?: { phoneOtp: string; emailOtp: string }
  }>(['/api/auth/register/start', '/api/auth/register', '/auth/register'], {
    ...input,
    phone: normalizedPhone,
    mobile: normalizedPhone,
    channels: input.deliveryChannels,
    otpChannels: input.deliveryChannels,
    emailAddress: input.email
  })
}

export function verifyRegistrationApi(input: { phone?: string; mobile?: string; otp: string }) {
  const normalizedPhone = input.phone || input.mobile

  if (!normalizedPhone) {
    throw new Error('Phone number is required for OTP verification')
  }

  return postWithFallback<{
    ok: true
    user?: {
      id: string
      phone: string
      email?: string | null
      verifiedAt?: string | null
      avatarUrl?: string | null
      pinSet?: boolean
      role?: string
    }
    next?: string
  }>(['/api/auth/register/verify', '/api/auth/verify', '/auth/verify'], {
    ...input,
    phone: normalizedPhone,
    mobile: normalizedPhone
  })
}

/* ---------------- PIN ---------------- */

export function setPinApi(input: { phone: string; pin: string; userId?: string; email?: string }) {
  return postWithFallback<{ ok: true }>(['/api/auth/pin/set', '/api/auth/set-pin', '/auth/set-pin'], input)
}

export function startPinResetApi(input: { phone?: string; email?: string }) {
  const normalizedPhone = input.phone
  return postWithFallback<{ ok: true; code?: string; channel?: 'phone' | 'email' }>([
    '/api/auth/pin/reset/start',
    '/api/auth/pin/forgot/start',
    '/api/auth/reset-pin/start'
  ], {
    ...input,
    ...(normalizedPhone ? { phone: normalizedPhone, mobile: normalizedPhone } : {})
  })
}

export function verifyPinResetApi(input: { phone?: string; email?: string; otp: string }) {
  const normalizedPhone = input.phone
  return postWithFallback<{ ok: true }>([
    '/api/auth/pin/reset/verify',
    '/api/auth/pin/forgot/verify',
    '/api/auth/reset-pin/verify'
  ], {
    ...input,
    ...(normalizedPhone ? { phone: normalizedPhone, mobile: normalizedPhone } : {})
  })
}

export function completePinResetApi(input: { phone?: string; email?: string; pin: string }) {
  const normalizedPhone = input.phone
  return postWithFallback<{ ok: true }>([
    '/api/auth/pin/reset/complete',
    '/api/auth/pin/forgot/complete',
    '/api/auth/reset-pin/complete'
  ], {
    ...input,
    ...(normalizedPhone ? { phone: normalizedPhone, mobile: normalizedPhone } : {})
  })
}

export function updatePinApi(input: { phone: string; oldPin: string; newPin: string }) {
  return post<{ ok: true }>('/api/auth/pin/change', input)
}

/* ---------------- LOGIN ---------------- */

export function loginApi(input: { phone: string; pin: string }) {
  return postWithFallback<{
    ok: true
    user: {
      id: string
      phone: string
      email?: string | null
      verifiedAt?: string | null
      avatarUrl?: string | null
      pinSet?: boolean
      role?: string
    }
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
    next?: string
  }>(['/api/auth/login', '/auth/login'], input)
}

export function refreshAuthApi(input: { refreshToken: string }) {
  return postWithFallback<{
    ok: true
    user: {
      id: string
      phone: string
      email?: string | null
      verifiedAt?: string | null
      avatarUrl?: string | null
      pinSet?: boolean
      role?: string
    }
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
  }>(['/api/auth/refresh', '/auth/refresh'], input)
}

/* ---------------- PROFILE ---------------- */

export function checkIdentityApi(input: { phone: string; email?: string }) {
  return post<{ exists: boolean; phoneExists?: boolean; emailExists?: boolean }>('/api/auth/identity/check', input)
}

export function requestOtpApi(input: { phone?: string; mobile?: string; email?: string; purpose: string; resend?: boolean }) {
  const normalizedPhone = input.phone || input.mobile
  return postWithFallback<{ ok: true; code?: string }>(['/api/auth/otp/request', '/auth/otp/request'], {
    ...input,
    ...(normalizedPhone ? { phone: normalizedPhone, mobile: normalizedPhone } : {})
  })
}

export function verifyOtpApi(input: { phone?: string; mobile?: string; email?: string; otp: string; purpose: string }) {
  const normalizedPhone = input.phone || input.mobile
  return postWithFallback<{ ok: true; token?: string }>(['/api/auth/otp/verify', '/auth/otp/verify'], {
    ...input,
    ...(normalizedPhone ? { phone: normalizedPhone, mobile: normalizedPhone } : {})
  })
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
