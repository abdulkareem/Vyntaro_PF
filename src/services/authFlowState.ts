export type AuthFlowIdentity = {
  countryCode: string
  phone: string
  fullPhone: string
  email?: string
  name?: string
  flow: 'register' | 'reset'
}

export type AuthFlowOtpSession = {
  purpose: 'register' | 'reset'
  attemptsUsed: number
  maxAttempts: number
  resendEnabled: boolean
}

export type AuthFlowPinContext = {
  flow: 'register' | 'reset'
  identifier: { phone?: string; email?: string }
  otpContext?: {
    userId?: string
    otpSessionId?: string
    verificationToken?: string
    temporaryAuthToken?: string
  }
}

type AuthFlowState = {
  identity?: AuthFlowIdentity
  otpSession?: AuthFlowOtpSession
  pinContext?: AuthFlowPinContext
}

const AUTH_FLOW_STATE_KEY = 'auth_flow_state'

function readState(): AuthFlowState {
  const raw = sessionStorage.getItem(AUTH_FLOW_STATE_KEY)
  if (!raw) return {}

  try {
    return JSON.parse(raw) as AuthFlowState
  } catch {
    return {}
  }
}

function writeState(next: AuthFlowState) {
  sessionStorage.setItem(AUTH_FLOW_STATE_KEY, JSON.stringify(next))
}

export function getAuthFlowState() {
  return readState()
}

export function setAuthFlowIdentity(identity: AuthFlowIdentity) {
  const current = readState()
  writeState({ ...current, identity })
}

export function setAuthFlowOtpSession(otpSession: AuthFlowOtpSession) {
  const current = readState()
  writeState({ ...current, otpSession })
}

export function updateAuthFlowOtpSession(patch: Partial<AuthFlowOtpSession>) {
  const current = readState()
  if (!current.otpSession) return
  writeState({ ...current, otpSession: { ...current.otpSession, ...patch } })
}

export function setAuthFlowPinContext(pinContext: AuthFlowPinContext) {
  const current = readState()
  writeState({ ...current, pinContext })
}

export function clearAuthFlowState() {
  sessionStorage.removeItem(AUTH_FLOW_STATE_KEY)
}
