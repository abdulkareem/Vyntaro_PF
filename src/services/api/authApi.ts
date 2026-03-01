import { requestJson } from './httpClient'

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

function resolvePhone(phone?: string, mobile?: string) {
  return phone || mobile
}

export function registerStartApi(input: RegisterStartInput) {
  const normalizedPhone = resolvePhone(input.phone, input.mobile)
  if (!normalizedPhone) throw new Error('Phone number is required to start registration')

  return requestJson<{
    userId: string
    devOtp?: { phoneOtp: string; emailOtp: string }
  }>('/api/auth/register/start', {
    method: 'POST',
    body: {
      ...input,
      phone: normalizedPhone,
      mobile: normalizedPhone,
      channels: input.deliveryChannels,
      otpChannels: input.deliveryChannels,
      emailAddress: input.email
    }
  })
}

export function verifyRegistrationApi(input: { phone?: string; mobile?: string; otp: string }) {
  const normalizedPhone = resolvePhone(input.phone, input.mobile)
  if (!normalizedPhone) throw new Error('Phone number is required for OTP verification')

  return requestJson<{
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
    attemptsRemaining?: number
    userId?: string
    otpSessionId?: string
    verificationToken?: string
    temporaryAuthToken?: string
  }>('/api/auth/register/otp/verify', {
    method: 'POST',
    body: {
      ...input,
      phone: normalizedPhone,
      mobile: normalizedPhone
    }
  })
}

export function setPinApi(input: { phone: string; pin: string; userId?: string; email?: string }) {
  return requestJson<{ ok: true; next?: string }>('/api/auth/pin/set', { method: 'POST', body: input })
}

export function setPinWithModeApi(input: {
  pin: string
  mode: 'register' | 'reset'
  userId?: string
  otpSessionId?: string
  verificationToken?: string
  temporaryAuthToken?: string
}) {
  const { temporaryAuthToken, ...body } = input
  return requestJson<{ ok: true; next?: string; message?: string }>('/api/auth/pin/set', {
    method: 'POST',
    body,
    ...(temporaryAuthToken ? { authToken: temporaryAuthToken } : {})
  })
}

export function startPinResetApi(input: { phone?: string; email?: string }) {
  return requestJson<{ ok: true; code?: string; channel?: 'phone' | 'email'; next?: string }>('/api/auth/pin/reset/start', {
    method: 'POST',
    body: {
      ...input,
      ...(input.phone ? { mobile: input.phone } : {})
    }
  })
}

export function verifyPinResetApi(input: { phone?: string; email?: string; otp: string }) {
  return requestJson<{
    ok: true
    next?: string
    attemptsRemaining?: number
    userId?: string
    otpSessionId?: string
    verificationToken?: string
    temporaryAuthToken?: string
  }>('/api/auth/pin/reset/otp/verify', {
    method: 'POST',
    body: {
      ...input,
      mode: 'reset',
      ...(input.phone ? { mobile: input.phone } : {})
    }
  })
}

export function completePinResetApi(input: { phone?: string; email?: string; pin: string }) {
  return requestJson<{ ok: true; next?: string }>('/api/auth/pin/reset/complete', {
    method: 'POST',
    body: {
      ...input,
      ...(input.phone ? { mobile: input.phone } : {})
    }
  })
}

export function updatePinApi(input: { phone: string; oldPin: string; newPin: string }) {
  return requestJson<{ ok: true }>('/api/auth/pin/change', { method: 'POST', body: input })
}

export function loginApi(input: { phone?: string; email?: string; identifier?: string; pin: string }) {
  return requestJson<{
    ok: true
    user: {
      id: string
      phone: string
      name?: string | null
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
  }>('/api/auth/login', { method: 'POST', body: input })
}

export function refreshAuthApi(input: { refreshToken: string }) {
  return requestJson<{
    ok: true
    user: {
      id: string
      phone: string
      name?: string | null
      email?: string | null
      verifiedAt?: string | null
      avatarUrl?: string | null
      pinSet?: boolean
      role?: string
    }
    accessToken?: string
    refreshToken?: string
    expiresAt?: string
  }>('/api/auth/refresh', { method: 'POST', body: input })
}

export function fetchProfileMeApi() {
  return requestJson<{
    id: string
    name?: string | null
    phone?: string | null
    mobile?: string | null
    email?: string | null
    avatarUrl?: string | null
    verifiedAt?: string | null
    pinSet?: boolean
    role?: string
  }>('/api/profile/me', { useCredentials: true })
}

export function checkIdentityApi(input: { phone: string; email?: string }) {
  return requestJson<{ exists: boolean; phoneExists?: boolean; emailExists?: boolean; next?: string }>('/api/auth/identity/check', {
    method: 'POST',
    body: input
  })
}

export function requestOtpApi(input: { phone?: string; mobile?: string; email?: string; purpose: string; resend?: boolean }) {
  const normalizedPhone = resolvePhone(input.phone, input.mobile)
  return requestJson<{ ok: true; code?: string }>('/api/auth/otp/request', {
    method: 'POST',
    body: {
      ...input,
      ...(normalizedPhone ? { phone: normalizedPhone, mobile: normalizedPhone } : {})
    }
  })
}

export function resendOtpApi(input: { phone?: string; mobile?: string; email?: string; mode: 'register' | 'reset' }) {
  const normalizedPhone = resolvePhone(input.phone, input.mobile)
  return requestJson<{ ok: true; code?: string; next?: string; attemptsRemaining?: number }>('/api/auth/otp/resend', {
    method: 'POST',
    body: {
      mode: input.mode,
      email: input.email,
      ...(normalizedPhone ? { phone: normalizedPhone, mobile: normalizedPhone } : {})
    }
  })
}

export function verifyOtpApi(input: { phone?: string; mobile?: string; email?: string; otp: string; purpose: string }) {
  const normalizedPhone = resolvePhone(input.phone, input.mobile)
  return requestJson<{ ok: true; token?: string }>('/api/auth/otp/verify', {
    method: 'POST',
    body: {
      ...input,
      ...(normalizedPhone ? { phone: normalizedPhone, mobile: normalizedPhone } : {})
    }
  })
}

export function updateProfileApi(input: {
  userId: string
  email?: string
  phone?: string
  avatarUrl?: string
  otpToken: string
}) {
  return requestJson<{
    ok: true
    user: {
      id: string
      phone: string
      email?: string | null
      verifiedAt?: string | null
      avatarUrl?: string | null
    }
  }>('/api/auth/profile/update', { method: 'POST', body: input })
}
