import { loginApi, registerStartApi, requestOtpApi, setPinApi } from './api/authApi'

type LocationData = { lat: number; lon: number } | null

export type AppUser = {
  id: string
  mobile: string
  email?: string | null
  verifiedAt?: string | null
  name?: string
  trustedDevices: string[]
}

type Session = { user: AppUser } | null

type PendingRegistration = {
  mobile: string
  email?: string
  name?: string
  devOtp?: { phoneOtp: string; emailOtp: string }
}

type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'device_unverified'; needsOTP?: string }

type PinResetRequestResult = { ok: true; code?: string } | { ok: false; reason: 'not_found' | 'throttled' | 'not_supported'; message?: string }
type PinResetVerifyResult = { ok: true } | { ok: false; reason: 'expired' | 'invalid' | 'not_supported'; message?: string }
type PinSetResult = { ok: true } | { ok: false; reason?: 'not_supported'; message?: string }

const SESSION_KEY = 'session'
const PENDING_REG_KEY = 'pending_registration'
const PIN_RESET_ERR = 'PIN reset is handled by backend endpoints that are not yet available in this frontend.'

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

function setSession(user: AppUser) {
  storage.write<Session>(SESSION_KEY, { user })
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

function mapUser(input: { id: string; phone: string; email?: string | null; verifiedAt?: string | null }, name?: string): AppUser {
  return {
    id: input.id,
    mobile: input.phone,
    email: input.email,
    verifiedAt: input.verifiedAt,
    name,
    trustedDevices: []
  }
}

export function getSession(): Session {
  return storage.read<Session>(SESSION_KEY, null)
}

export function logout() {
  storage.del(SESSION_KEY)
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
    mobile: input.mobile,
    email: input.email,
    name: input.name,
    devOtp: response.devOtp
  })

  return response
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
  await setPinApi({ phone: mobile, pin })
  const login = await loginApi({ phone: mobile, pin })
  const pending = getPendingRegistration()
  setSession(mapUser(login.user, pending?.name))
  clearPendingRegistration()
  return { ok: true as const }
}

export async function loginWithPin(mobile: string, pin: string): Promise<LoginResult> {
  try {
    const res = await loginApi({ phone: mobile, pin })
    const pending = getPendingRegistration()
    setSession(mapUser(res.user, pending?.name))
    return { ok: true as const }
  } catch {
    return { ok: false as const, reason: 'invalid' as const }
  }
}

export function completeOtpSession(input: { phone: string; name?: string; email?: string }) {
  setSession({
    id: input.phone,
    mobile: input.phone,
    email: input.email,
    name: input.name,
    trustedDevices: []
  })
}

export function verifyDeviceOTP(_mobile: string, _code: string) {
  return { ok: false as const, reason: 'not_supported' as const }
}

export function currentUser(): AppUser | null {
  return getSession()?.user ?? null
}

export function startPinReset(_mobile: string): PinResetRequestResult {
  return { ok: false as const, reason: 'not_supported' as const, message: PIN_RESET_ERR }
}

export function verifyPinReset(_mobile: string, _code: string): PinResetVerifyResult {
  return { ok: false as const, reason: 'not_supported' as const, message: PIN_RESET_ERR }
}

export async function setNewPin(_mobile: string, _pin: string): Promise<PinSetResult> {
  return { ok: false as const, reason: 'not_supported' as const, message: PIN_RESET_ERR }
}

export async function updatePin(_mobile: string, _oldPin: string, _newPin: string): Promise<PinSetResult> {
  return { ok: false as const, reason: 'not_supported' as const, message: 'Change PIN backend endpoint is not yet wired in this frontend.' }
}
