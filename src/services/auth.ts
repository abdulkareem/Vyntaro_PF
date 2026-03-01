import {
  checkIdentityApi,
  completePinResetApi,
  loginApi,
  refreshAuthApi,
  registerStartApi,
  requestOtpApi,
  setPinApi,
  setPinWithModeApi,
  startPinResetApi,
  updatePinApi,
  updateProfileApi,
  verifyPinResetApi,
  verifyOtpApi
} from './api/authApi'
import { isApiRequestError } from './api/httpClient'

type LocationData = { lat: number; lon: number } | null

type AuthStatus = 'online_verified' | 'offline_authenticated'

export type AppUser = {
  id: string
  mobile: string
  email?: string | null
  verifiedAt?: string | null
  name?: string
  avatarUrl?: string | null
  trustedDevices: string[]
  pinSet: boolean
  role?: string
}

type Session = {
  user: AppUser
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  authStatus: AuthStatus
  lastValidatedAt: string
} | null

type PendingRegistration = {
  userId?: string
  mobile: string
  email?: string
  name?: string
  devOtp?: { phoneOtp: string; emailOtp: string }
}

type LoginResult =
  | { ok: true; user: AppUser; mode: AuthStatus; next?: string }
  | { ok: false; reason: 'invalid' | 'pin_not_set' | 'offline_unavailable' }

type PinResetRequestResult = { ok: true; code?: string; next?: string } | { ok: false; reason: 'not_found' | 'throttled' | 'not_supported'; message?: string; code?: string }
type PinResetVerifyResult = { ok: true; next?: string; attemptsRemaining?: number } | { ok: false; reason: 'expired' | 'invalid' | 'not_supported'; message?: string; code?: string; attemptsRemaining?: number }
type PinSetResult = { ok: true; next?: string } | { ok: false; reason?: 'not_supported'; message?: string }

type OfflineCredential = {
  mobile: string
  salt: string
  verifier: string
  cachedUser: AppUser
  updatedAt: string
}

const SESSION_KEY = 'session'
const PENDING_REG_KEY = 'pending_registration'
const OFFLINE_AUTH_KEY = 'offline_auth_credential'

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

function setSession(session: NonNullable<Session>) {
  storage.write<Session>(SESSION_KEY, session)
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

function mapUser(input: { id: string; phone: string; email?: string | null; verifiedAt?: string | null; avatarUrl?: string | null; pinSet?: boolean; role?: string }, name?: string): AppUser {
  return {
    id: input.id,
    mobile: input.phone,
    email: input.email,
    verifiedAt: input.verifiedAt,
    name,
    avatarUrl: input.avatarUrl,
    trustedDevices: [],
    pinSet: Boolean(input.pinSet),
    role: input.role
  }
}

function isNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('failed to fetch') || message.includes('networkerror') || message.includes('network request failed')
}

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}


async function sha256(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toBase64(new Uint8Array(hash))
}

async function createOfflineCredential(mobile: string, pin: string, user: AppUser) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = toBase64(saltBytes)
  const verifier = await sha256(`${mobile}:${pin}:${salt}`)
  const credential: OfflineCredential = {
    mobile,
    salt,
    verifier,
    cachedUser: user,
    updatedAt: new Date().toISOString()
  }
  storage.write(OFFLINE_AUTH_KEY, credential)
}

async function canLoginOffline(mobile: string, pin: string): Promise<AppUser | null> {
  const credential = storage.read<OfflineCredential | null>(OFFLINE_AUTH_KEY, null)
  if (!credential || credential.mobile !== mobile) return null
  const recomputed = await sha256(`${mobile}:${pin}:${credential.salt}`)
  if (recomputed !== credential.verifier) return null
  return credential.cachedUser.pinSet ? credential.cachedUser : null
}

export function getSession(): Session {
  return storage.read<Session>(SESSION_KEY, null)
}

export function getAuthStatus(): AuthStatus | null {
  return getSession()?.authStatus ?? null
}

export function logout() {
  storage.del(SESSION_KEY)
  notifyAuthChanged()
}

export function isAuthenticated(): boolean {
  const user = getSession()?.user
  return Boolean(user?.id && user.pinSet)
}

export function requiresPinSetup(): boolean {
  const user = getSession()?.user
  return Boolean(user?.id && !user.pinSet)
}

export async function registerStart(input: { mobile: string; email?: string; name: string; location: LocationData; countryCode: string }) {
  const normalizedEmail = String(input.email || '').trim().toLowerCase()
  const hasEmail = Boolean(normalizedEmail)

  let response
  try {
    response = await registerStartApi({
      phone: input.mobile,
      mobile: input.mobile,
      email: hasEmail ? normalizedEmail : undefined,
      country: input.countryCode,
      deliveryChannels: hasEmail ? ['phone', 'email'] : ['phone'],
      sendOtpToPhone: true,
      sendOtpToEmail: hasEmail
    })
  } catch (error) {
    if (isApiRequestError(error)) {
      if (error.status === 400) throw new Error(error.message || 'Please check your registration details and try again.')
      if (error.status === 404) throw new Error(error.message || 'Registration service is unavailable right now.')
    }
    throw error
  }

  setPendingRegistration({
    userId: response.userId,
    mobile: input.mobile,
    email: normalizedEmail,
    name: input.name,
    devOtp: response.devOtp
  })

  return response
}

export async function checkIdentity(input: { mobile: string; email?: string }) {
  const normalizedEmail = typeof input.email === 'string' ? input.email.trim().toLowerCase() : undefined
  return checkIdentityApi({ phone: input.mobile, email: normalizedEmail })
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
  const setPinResponse = await setPinApi({
    phone: mobile,
    pin,
    userId: pending?.userId,
    email: pending?.email
  })
  const login = await loginApi({ phone: mobile, pin })
  const user = mapUser(login.user, pending?.name)
  const now = new Date().toISOString()
  setSession({
    user,
    accessToken: login.accessToken,
    refreshToken: login.refreshToken,
    expiresAt: login.expiresAt,
    authStatus: 'online_verified',
    lastValidatedAt: now
  })
  await createOfflineCredential(mobile, pin, user)
  clearPendingRegistration()
  return { ok: true as const, next: setPinResponse.next }
}

export async function loginWithPin(identifier: string, pin: string): Promise<LoginResult> {
  const normalized = identifier.trim().toLowerCase()
  const isEmail = normalized.includes('@')
  try {
    const res = await loginApi({
      pin,
      phone: isEmail ? undefined : normalized,
      email: isEmail ? normalized : undefined,
      identifier: normalized
    })
    const pending = getPendingRegistration()
    const user = mapUser(res.user, pending?.name)
    if (!user.pinSet) return { ok: false, reason: 'pin_not_set' }

    const now = new Date().toISOString()
    setSession({
      user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      expiresAt: res.expiresAt,
      authStatus: 'online_verified',
      lastValidatedAt: now
    })
    await createOfflineCredential(user.mobile, pin, user)
    return { ok: true as const, user, mode: 'online_verified', next: res.next }
  } catch (error) {
    if (!navigator.onLine || isNetworkError(error)) {
      const offlineUser = await canLoginOffline(normalized, pin)
      if (offlineUser) {
        setSession({
          user: offlineUser,
          authStatus: 'offline_authenticated',
          lastValidatedAt: new Date().toISOString()
        })
        return { ok: true as const, user: offlineUser, mode: 'offline_authenticated' }
      }
      return { ok: false as const, reason: 'offline_unavailable' as const }
    }

    return { ok: false as const, reason: 'invalid' as const }
  }
}

export async function revalidateSession(): Promise<boolean> {
  const current = getSession()
  if (!current?.refreshToken || !navigator.onLine) return false

  try {
    const refreshed = await refreshAuthApi({ refreshToken: current.refreshToken })
    const user = mapUser(refreshed.user, current.user.name)
    if (!user.pinSet) {
      logout()
      return false
    }
    setSession({
      user,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || current.refreshToken,
      expiresAt: refreshed.expiresAt,
      authStatus: 'online_verified',
      lastValidatedAt: new Date().toISOString()
    })
    return true
  } catch {
    return false
  }
}

export function completeOtpSession(input: { id?: string; phone: string; name?: string; email?: string }) {
  setSession({
    user: {
      id: input.id || input.phone,
      mobile: input.phone,
      email: input.email,
      name: input.name,
      avatarUrl: null,
      trustedDevices: [],
      pinSet: false
    },
    authStatus: 'online_verified',
    lastValidatedAt: new Date().toISOString()
  })
}

export function currentUser(): AppUser | null {
  return getSession()?.user ?? null
}

export async function startPinReset(identifier: { phone?: string; email?: string }): Promise<PinResetRequestResult> {
  const normalizedEmail = identifier.email?.trim().toLowerCase()
  try {
    const result = await startPinResetApi({ phone: identifier.phone, email: normalizedEmail })
    return { ok: true, code: result.code, next: result.next }
  } catch (e: any) {
    if (isApiRequestError(e)) {
      const payload = e.payload && typeof e.payload === 'object' ? e.payload as { code?: string } : undefined
      if (e.status === 404) {
        return { ok: false, reason: 'not_found', message: e.message || 'Account not found for provided details.', code: payload?.code }
      }

      if (e.status === 400) {
        return { ok: false, reason: 'not_supported', message: e.message || 'Please check your details and try again.', code: payload?.code }
      }

      if (e.status === 429) {
        return { ok: false, reason: 'throttled', message: e.message || 'Too many attempts. Please try again shortly.', code: payload?.code }
      }
    }

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
    const response = await verifyPinResetApi({ phone: identifier.phone, email: identifier.email, otp: code })
    return { ok: true, next: response.next, attemptsRemaining: response.attemptsRemaining }
  } catch (e: any) {
    if (isApiRequestError(e)) {
      const payload = e.payload && typeof e.payload === 'object'
        ? e.payload as { code?: string; attemptsRemaining?: number }
        : undefined
      const codeFromApi = payload?.code
      if (codeFromApi === 'OTP_EXPIRED') {
        return { ok: false, reason: 'expired', message: e?.message || 'OTP expired.', code: codeFromApi, attemptsRemaining: payload?.attemptsRemaining }
      }
      return { ok: false, reason: 'invalid', message: e?.message || 'Invalid OTP', code: codeFromApi, attemptsRemaining: payload?.attemptsRemaining }
    }
    return { ok: false, reason: 'invalid', message: e?.message || 'Invalid OTP' }
  }
}

export async function setNewPin(identifier: { phone?: string; email?: string }, pin: string): Promise<PinSetResult> {
  try {
    const response = await completePinResetApi({ phone: identifier.phone, email: identifier.email, pin })
    return { ok: true, next: response.next }
  } catch (e: any) {
    return { ok: false, reason: 'not_supported', message: e?.message || 'Failed to reset PIN' }
  }
}

export async function setPinByMode(input: { pin: string; mode: 'register' | 'reset' }): Promise<PinSetResult & { message?: string }> {
  try {
    const response = await setPinWithModeApi(input)
    return { ok: true, next: response.next, message: response.message }
  } catch (e: any) {
    return { ok: false, reason: 'not_supported', message: e?.message || 'Failed to save PIN.' }
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

  const current = getSession()
  if (!current) return result.user

  setSession({
    ...current,
    user: { ...user, mobile: result.user.phone, email: result.user.email, avatarUrl: result.user.avatarUrl }
  })
  return result.user
}
