import {
  checkIdentityApi,
  completePinResetApi,
  loginApi,
  registerStartApi,
  requestOtpApi,
  setPinApi,
  startPinResetApi,
  updatePinApi,
  updateProfileApi,
  verifyPinResetApi,
  verifyOtpApi
} from './api/authApi'

type LocationData = { lat: number; lon: number } | null

export type AppUser = {
  id: string
  mobile: string
  email?: string | null
  verifiedAt?: string | null
  name?: string
  avatarUrl?: string | null
  trustedDevices: string[]
}

type Session = { user: AppUser } | null

type PendingRegistration = {
  userId?: string
  mobile: string
  email?: string
  name?: string
  devOtp?: { phoneOtp: string; emailOtp: string }
}

type LoginResult =
  | { ok: true; user: AppUser }
  | { ok: false; reason: 'invalid' }

type PinResetRequestResult = { ok: true; code?: string } | { ok: false; reason: 'not_found' | 'throttled' | 'not_supported'; message?: string }
type PinResetVerifyResult = { ok: true } | { ok: false; reason: 'expired' | 'invalid' | 'not_supported'; message?: string }
type PinSetResult = { ok: true } | { ok: false; reason?: 'not_supported'; message?: string }

const SESSION_KEY = 'session'
const PENDING_REG_KEY = 'pending_registration'

const storage = {
  read<T>(k: string, d: T): T {
    const v = localStorage.getItem(k)
    return v ? JSON.parse(v) as T : d
  },
  write<T>(k: string, v: T) {
    localStorage.setItem(k, JSON.stringify(v))
  },
  del(k: string) {
    localStorage.removeItem(k)
  }
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event('auth-changed'))
}

function setSession(user: AppUser) {
  storage.write<Session>(SESSION_KEY, { user })
  notifyAuthChanged()
}

function getPendingRegistration() {
  return storage.read<PendingRegistration | null>(PENDING_REG_KEY, null)
}

function setPendingRegistration(v: PendingRegistration) {
  storage.write(PENDING_REG_KEY, v)
}

function clearPendingRegistration() {
  storage.del(PENDING_REG_KEY)
}

function mapUser(input: { id: string; phone: string; email?: string | null; verifiedAt?: string | null; avatarUrl?: string | null }, name?: string): AppUser {
  return {
    id: input.id,
    mobile: input.phone,
    email: input.email,
    verifiedAt: input.verifiedAt,
    name,
    avatarUrl: input.avatarUrl,
    trustedDevices: []
  }
}

export function getSession(): Session {
  return storage.read<Session>(SESSION_KEY, null)
}

export function logout() {
  storage.del(SESSION_KEY)
  notifyAuthChanged()
}

export function isAuthenticated(): boolean {
  return !!getSession()?.user?.id
}

export async function registerStart(input: { mobile: string; email: string; name: string; location: LocationData }) {
  const response = await registerStartApi({
    phone: input.mobile,
    email: input.email || undefined
  })

  setPendingRegistration({
    userId: response.userId,
    mobile: input.mobile,
    email: input.email,
    name: input.name,
    devOtp: response.devOtp
  })

  return response
}

export async function checkIdentity(input: { mobile: string; email?: string }) {
  return checkIdentityApi({ phone: input.mobile, email: input.email })
}

export function resendRegistrationOTP(_mobile: string) {
  const pending = getPendingRegistration()
  if (!pending) return { error: 'missing' as const }

  return {
    phoneCode: import.meta.env.DEV ? pending.devOtp?.phoneOtp : undefined,
    emailCode: import.meta.env.DEV ? pending.devOtp?.emailOtp : undefined
  }
}

export async function setPin(mobile: string, pin: string): Promise<PinSetResult> {
  const pending = getPendingRegistration()
  await setPinApi({
    phone: mobile,
    pin,
    userId: pending?.userId,
    email: pending?.email
  })
  const login = await loginApi({ phone: mobile, pin })
  setSession(mapUser(login.user, pending?.name))
  clearPendingRegistration()
  return { ok: true as const }
}

export async function loginWithPin(mobile: string, pin: string): Promise<LoginResult> {
  try {
    const res = await loginApi({ phone: mobile, pin })
    const pending = getPendingRegistration()
    const user = mapUser(res.user, pending?.name)
    setSession(user)
    return { ok: true as const, user }
  } catch {
    return { ok: false as const, reason: 'invalid' as const }
  }
}

export function completeOtpSession(input: { id?: string; phone: string; name?: string; email?: string }) {
  setSession({
    id: input.id || input.phone,
    mobile: input.phone,
    email: input.email,
    name: input.name,
    avatarUrl: null,
    trustedDevices: []
  })
}

export function currentUser(): AppUser | null {
  return getSession()?.user ?? null
}

export async function startPinReset(identifier: { phone?: string; email?: string }): Promise<PinResetRequestResult> {
  try {
    const result = await startPinResetApi({ phone: identifier.phone, email: identifier.email })
    return { ok: true, code: result.code }
  } catch (e: any) {
    const message = e?.message || 'Failed to start PIN reset.'
    const normalizedMessage = String(message).toLowerCase()

    if (
      normalizedMessage.includes('not registered')
      || normalizedMessage.includes('not found')
      || normalizedMessage.includes('no account')
      || normalizedMessage.includes('does not exist')
    ) {
      return { ok: false, reason: 'not_found', message }
    }

    if (normalizedMessage.includes('too many') || normalizedMessage.includes('throttle')) {
      return { ok: false, reason: 'throttled', message }
    }

    return { ok: false, reason: 'not_supported', message }
  }
}

export async function verifyPinReset(identifier: { phone?: string; email?: string }, code: string): Promise<PinResetVerifyResult> {
  try {
    await verifyPinResetApi({ phone: identifier.phone, email: identifier.email, otp: code })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, reason: 'invalid', message: e?.message || 'Invalid OTP' }
  }
}

export async function setNewPin(identifier: { phone?: string; email?: string }, pin: string): Promise<PinSetResult> {
  try {
    await completePinResetApi({ phone: identifier.phone, email: identifier.email, pin })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, reason: 'not_supported', message: e?.message || 'Failed to reset PIN' }
  }
}

export async function updatePin(mobile: string, oldPin: string, newPin: string): Promise<PinSetResult> {
  try {
    await updatePinApi({ phone: mobile, oldPin, newPin })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, reason: 'not_supported', message: e?.message || 'Failed to update PIN.' }
  }
}

export async function requestProfileUpdateOtp(input: { mobile?: string; email?: string }) {
  return requestOtpApi({ ...input, purpose: 'profile_update' })
}

export async function verifyProfileUpdateOtp(input: { mobile?: string; email?: string; otp: string }) {
  return verifyOtpApi({ ...input, purpose: 'profile_update' })
}

export async function updateProfile(input: { email?: string; mobile?: string; avatarUrl?: string; otpToken: string }) {
  const user = currentUser()
  if (!user) throw new Error('No active user session.')
  const result = await updateProfileApi({
    userId: user.id,
    email: input.email,
    phone: input.mobile,
    avatarUrl: input.avatarUrl,
    otpToken: input.otpToken
  })

  setSession({ ...user, mobile: result.user.phone, email: result.user.email, avatarUrl: result.user.avatarUrl })
  return result.user
}
