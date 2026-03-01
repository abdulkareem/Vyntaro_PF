import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import PinSetupInput from '../components/auth/PinSetupInput'
import { clearStoredAuthArtifacts, setPinByMode } from '../services/auth'
import { clearAuthFlowState, getAuthFlowState } from '../services/authFlowState'

function hasOtpContext(flowState: ReturnType<typeof getAuthFlowState>) {
  const otpContext = flowState.pinContext?.otpContext
  return Boolean(
    otpContext?.otpSessionId
    || otpContext?.temporaryAuthToken
    || otpContext?.verificationToken
    || otpContext?.userId
  )
}

export default function SetPin() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const flowState = getAuthFlowState()

  const mobile = useMemo(() => {
    const fromQuery = sp.get('mobile') || flowState.pinContext?.identifier.phone || ''
    if (fromQuery) return fromQuery
    const verified = localStorage.getItem('verified_identity')
    if (!verified) return ''
    try {
      return (JSON.parse(verified) as { phone?: string }).phone || ''
    } catch {
      return ''
    }
  }, [flowState.pinContext?.identifier.phone, sp])

  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const queryMode = sp.get('mode')
  const mode: 'reset' | 'register' = queryMode === 'reset' || queryMode === 'register'
    ? queryMode
    : (flowState.pinContext?.flow ?? 'register')

  const otpContextPresent = hasOtpContext(flowState)

  useEffect(() => {
    if (otpContextPresent) return

    const phoneParam = flowState.pinContext?.identifier.phone ? `&phone=${encodeURIComponent(flowState.pinContext.identifier.phone)}` : ''
    const emailParam = flowState.pinContext?.identifier.email ? `&email=${encodeURIComponent(flowState.pinContext.identifier.email)}` : ''
    nav(`/verify?mode=${mode}${phoneParam}${emailParam}`, {
      replace: true,
      state: { message: 'Please verify OTP again' }
    })
  }, [mode, nav, otpContextPresent, flowState.pinContext?.identifier.phone, flowState.pinContext?.identifier.email])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpContextPresent) {
      setError('Please verify OTP again')
      return
    }

    if (!/^\d{4}$/.test(pin)) return setError('Enter and confirm a 4-digit PIN.')

    setLoading(true)
    setError(null)

    try {
      const result = await setPinByMode({
        pin,
        mode,
        userId: flowState.pinContext?.otpContext?.userId,
        otpSessionId: flowState.pinContext?.otpContext?.otpSessionId,
        verificationToken: flowState.pinContext?.otpContext?.verificationToken,
        temporaryAuthToken: flowState.pinContext?.otpContext?.temporaryAuthToken
      })
      if (!result.ok) {
        setError(result.message || 'Failed to save PIN.')
        return
      }

      clearAuthFlowState()

      if (mode === 'reset') {
        clearStoredAuthArtifacts()
        const message = result.message || 'PIN reset successful. Please sign in with your new PIN.'
        setSuccessMessage(message)
        nav('/login', { replace: true, state: { successMessage: message } })
        return
      }

      nav('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={72} />
        <h2>{mode === 'reset' ? 'Set New PIN' : 'Create Login PIN'}</h2>
        <p className="neo-auth-sub">Use a secure 4-digit PIN.</p>

        <form onSubmit={submit} className="neo-form-stack">
          <input className="neo-control" value={mobile || flowState.pinContext?.identifier.email || 'Using your verified identity'} readOnly aria-label="Identity" />
          <PinSetupInput value={pin} onChange={setPin} disabled={loading || !otpContextPresent} />
          <button className="neo-btn neo-btn-primary" type="submit" disabled={loading || pin.length !== 4 || !otpContextPresent}>{loading ? 'Saving…' : 'Save PIN'}</button>
          {error && <p className="error">{error}</p>}
          {successMessage && mode === 'reset' && <p className="neo-success">{successMessage}</p>}
        </form>
      </section>
    </main>
  )
}
