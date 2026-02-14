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

type LocationData = { lat: number; lon: number } | null
type User = {
  mobile: string
  email: string
  name: string
  location: LocationData
  pinSalt?: string
  pinHash?: string
  verified: boolean
  trustedDevices: string[]
}

type Users = Record<string, User>

function deviceId(): string {
  let id = localStorage.getItem('device_id')
  if (!id) {
    const a = new Uint8Array(16)
    crypto.getRandomValues(a)
    id = Array.from(a).map(x => x.toString(16).padStart(2, '0')).join('')
    localStorage.setItem('device_id', id)
  }
  return id
}

async function sha256Hex(data: string): Promise<string> {
  const enc = new TextEncoder().encode(data)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function users(): Users {
  return storage.read<Users>('users', {})
}
function saveUsers(u: Users) {
  storage.write('users', u)
}

type OTPPayload = { code: string; exp: number }
function genCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
function otpKey(mobile: string, channel: 'phone' | 'email' | 'device') {
  return `otp:${mobile}:${channel}`
}
const RL_WINDOW_MS = 60_000
const RL_MAX_IN_WINDOW = 3
function rlKey(mobile: string, channel: 'phone' | 'email' | 'device') {
  return `otp_rl:${mobile}:${channel}`
}
function canSendOTP(mobile: string, channel: 'phone' | 'email' | 'device') {
  const now = Date.now()
  const history = storage.read<number[]>(rlKey(mobile, channel), []).filter(t => now - t < RL_WINDOW_MS)
  return { allowed: history.length < RL_MAX_IN_WINDOW, history }
}
function recordSend(mobile: string, channel: 'phone' | 'email' | 'device', prev: number[]) {
  const now = Date.now()
  const hist = [...prev.filter(t => now - t < RL_WINDOW_MS), now]
  storage.write(rlKey(mobile, channel), hist)
}
function createOTP(mobile: string, channel: 'phone' | 'email' | 'device') {
  const check = canSendOTP(mobile, channel)
  if (!check.allowed) {
    const now = Date.now()
    const next = RL_WINDOW_MS - (now - check.history[0])
    throw Object.assign(new Error('throttled'), { next })
  }
  const payload: OTPPayload = { code: genCode(), exp: Date.now() + 5 * 60_000 }
  storage.write(otpKey(mobile, channel), payload)
  recordSend(mobile, channel, check.history)
  return payload
}
function readOTP(mobile: string, channel: 'phone' | 'email' | 'device'): OTPPayload | null {
  return storage.read<OTPPayload | null>(otpKey(mobile, channel), null)
}
function clearOTP(mobile: string, channel: 'phone' | 'email' | 'device') {
  storage.del(otpKey(mobile, channel))
}

type Session = { mobile: string } | null
function setSession(mobile: string) {
  storage.write<Session>('session', { mobile })
}
export function getSession(): Session {
  return storage.read<Session>('session', null)
}
export function logout() {
  storage.del('session')
}
export function isAuthenticated(): boolean {
  const s = getSession()
  return !!s && !!users()[s.mobile]?.pinHash
}

export async function registerStart(input: { mobile: string; email: string; name: string; location: LocationData }) {
  const u = users()
  const exists = u[input.mobile]
  u[input.mobile] = {
    mobile: input.mobile,
    email: input.email,
    name: input.name,
    location: input.location,
    verified: false,
    trustedDevices: exists?.trustedDevices ?? []
  }
  saveUsers(u)
  const phoneOtp = createOTP(input.mobile, 'phone')
  const emailOtp = createOTP(input.mobile, 'email')
  return { phoneCode: import.meta.env.DEV ? phoneOtp.code : undefined, emailCode: import.meta.env.DEV ? emailOtp.code : undefined }
}

export function resendRegistrationOTP(mobile: string) {
  try {
    const phoneOtp = createOTP(mobile, 'phone')
    const emailOtp = createOTP(mobile, 'email')
    return { phoneCode: import.meta.env.DEV ? phoneOtp.code : undefined, emailCode: import.meta.env.DEV ? emailOtp.code : undefined }
  } catch (e: any) {
    return { error: 'throttled', next: e?.next as number | undefined }
  }
}

export function verifyRegistrationOTP(mobile: string, phoneCode: string, emailCode: string) {
  const p = readOTP(mobile, 'phone')
  const e = readOTP(mobile, 'email')
  if (!p || !e) return { ok: false, reason: 'expired' as const }
  if (Date.now() > p.exp || Date.now() > e.exp) return { ok: false, reason: 'expired' as const }
  if (p.code !== phoneCode || e.code !== emailCode) return { ok: false, reason: 'invalid' as const }
  clearOTP(mobile, 'phone')
  clearOTP(mobile, 'email')
  const u = users()
  if (!u[mobile]) return { ok: false, reason: 'missing' as const }
  u[mobile].verified = true
  saveUsers(u)
  return { ok: true as const }
}

export async function setPin(mobile: string, pin: string) {
  const u = users()
  const user = u[mobile]
  if (!user || !user.verified) return { ok: false }
  const saltA = new Uint8Array(16)
  crypto.getRandomValues(saltA)
  const salt = Array.from(saltA).map(x => x.toString(16).padStart(2, '0')).join('')
  const hash = await sha256Hex(pin + ':' + salt)
  user.pinSalt = salt
  user.pinHash = hash
  const did = deviceId()
  if (!user.trustedDevices.includes(did)) user.trustedDevices.push(did)
  saveUsers(u)
  setSession(mobile)
  return { ok: true }
}

export async function loginWithPin(mobile: string, pin: string) {
  const u = users()
  const user = u[mobile]
  if (!user || !user.pinSalt || !user.pinHash) return { ok: false, reason: 'not_found' as const }
  const hash = await sha256Hex(pin + ':' + user.pinSalt)
  if (hash !== user.pinHash) return { ok: false, reason: 'invalid' as const }
  const did = deviceId()
  if (!user.trustedDevices.includes(did)) {
    let otp
    try {
      otp = createOTP(mobile, 'device')
    } catch {
      otp = { code: '******' }
    }
    return { ok: false, reason: 'device_unverified' as const, needsOTP: import.meta.env.DEV ? otp.code : undefined }
  }
  setSession(mobile)
  return { ok: true as const }
}

export function verifyDeviceOTP(mobile: string, code: string) {
  const otp = readOTP(mobile, 'device')
  if (!otp) return { ok: false, reason: 'expired' as const }
  if (Date.now() > otp.exp) return { ok: false, reason: 'expired' as const }
  if (otp.code !== code) return { ok: false, reason: 'invalid' as const }
  clearOTP(mobile, 'device')
  const u = users()
  const user = u[mobile]
  if (!user) return { ok: false, reason: 'missing' as const }
  const did = deviceId()
  if (!user.trustedDevices.includes(did)) user.trustedDevices.push(did)
  saveUsers(u)
  setSession(mobile)
  return { ok: true as const }
}

export function currentUser(): User | null {
  const s = getSession()
  if (!s) return null
  return users()[s.mobile] ?? null
}

export function startPinReset(mobile: string) {
  const u = users()
  if (!u[mobile]) return { ok: false as const, reason: 'not_found' as const }
  try {
    const otp = createOTP(mobile, 'phone')
    return { ok: true as const, code: import.meta.env.DEV ? otp.code : undefined }
  } catch (e: any) {
    return { ok: false as const, reason: 'throttled' as const }
  }
}
export function verifyPinReset(mobile: string, code: string) {
  const otp = readOTP(mobile, 'phone')
  if (!otp) return { ok: false as const, reason: 'expired' as const }
  if (Date.now() > otp.exp) return { ok: false as const, reason: 'expired' as const }
  if (otp.code !== code) return { ok: false as const, reason: 'invalid' as const }
  clearOTP(mobile, 'phone')
  storage.write(`pin_reset:${mobile}`, true)
  return { ok: true as const }
}
export async function setNewPin(mobile: string, pin: string) {
  const allowed = storage.read<boolean>(`pin_reset:${mobile}`, false)
  if (!allowed) return { ok: false as const }
  const u = users()
  const user = u[mobile]
  if (!user) return { ok: false as const }
  const saltA = new Uint8Array(16); crypto.getRandomValues(saltA)
  const salt = Array.from(saltA).map(x => x.toString(16).padStart(2, '0')).join('')
  const hash = await sha256Hex(pin + ':' + salt)
  user.pinSalt = salt; user.pinHash = hash
  const did = deviceId()
  if (!user.trustedDevices.includes(did)) user.trustedDevices.push(did)
  saveUsers(u)
  storage.del(`pin_reset:${mobile}`)
  setSession(mobile)
  return { ok: true as const }
}
export async function updatePin(mobile: string, oldPin: string, newPin: string) {
  const u = users()
  const user = u[mobile]
  if (!user || !user.pinSalt || !user.pinHash) return { ok: false as const, reason: 'not_found' as const }
  const oldHash = await sha256Hex(oldPin + ':' + user.pinSalt)
  if (oldHash !== user.pinHash) return { ok: false as const, reason: 'invalid' as const }
  const saltA = new Uint8Array(16); crypto.getRandomValues(saltA)
  const salt = Array.from(saltA).map(x => x.toString(16).padStart(2, '0')).join('')
  const hash = await sha256Hex(newPin + ':' + salt)
  user.pinSalt = salt; user.pinHash = hash
  saveUsers(u)
  return { ok: true as const }
}
