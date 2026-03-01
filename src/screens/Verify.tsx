import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import { verifyRegistrationApi } from '../services/api/authApi'
import { completeOtpSession, registerStart, startPinReset, verifyPinReset } from '../services/auth'
import { resolveNextRoute } from '../services/authFlowNavigator'
import { getAuthFlowState, setAuthFlowOtpSession, setAuthFlowPinContext, updateAuthFlowOtpSession } from '../services/authFlowState'

const MAX_ATTEMPTS = 3

type OtpHintState = { message?: string } | null

export default function Verify() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const location = useLocation()
  const flow = getAuthFlowState()

  const queryMode = sp.get('mode')
  const mode = queryMode === 'reset' || queryMode === 'register' ? queryMode : (flow.otpSession?.purpose ?? 'register')
  const queryPhone = sp.get('phone') || sp.get('mobile')
  const phone = (queryPhone || flow.identity?.fullPhone || flow.pinContext?.identifier.phone || '').replace(/\s+/g, '')
  const email = (sp.get('email') || flow.identity?.email || flow.pinContext?.identifier.email || '').trim().toLowerCase() || undefined

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(flow.otpSession?.attemptsUsed ?? 0)

  const locked = attemptsUsed >= MAX_ATTEMPTS
  const attemptsRemaining = useMemo(() => Math.max(0, MAX_ATTEMPTS - attemptsUsed), [attemptsUsed])

  useEffect(() => {
    if (!phone) setError('Missing identity details. Please restart.')
    if (!flow.otpSession) setAuthFlowOtpSession({ purpose: mode, attemptsUsed, maxAttempts: MAX_ATTEMPTS, resendEnabled: false })

    const navState = location.state as OtpHintState
    if (navState?.message) setInfo(navState.message)
  }, [])

  async function handleVerify() {
    if (locked) return
    if (!otp) return setError('Please enter the OTP first.')

    try {
      setLoading(true)
      setError('')
      setInfo('')

      if (mode === 'reset') {
        const result = await verifyPinReset({ phone, email }, otp)
        if (!result.ok) {
          const nextUsed = result.attemptsRemaining != null ? MAX_ATTEMPTS - result.attemptsRemaining : attemptsUsed + 1
          const bounded = Math.min(MAX_ATTEMPTS, Math.max(0, nextUsed))
          setAttemptsUsed(bounded)
          updateAuthFlowOtpSession({ attemptsUsed: bounded, resendEnabled: bounded >= MAX_ATTEMPTS })
          setError(result.reason === 'expired' ? 'OTP expired. Request a new OTP to continue.' : (result.message || 'Invalid OTP.'))
          return
        }

        setAuthFlowPinContext({
          flow: 'reset',
          identifier: { phone, email },
          otpContext: {
            userId: result.userId,
            otpSessionId: result.otpSessionId,
            verificationToken: result.verificationToken,
            temporaryAuthToken: result.temporaryAuthToken
          }
        })
        const nextRoute = resolveNextRoute(result.next, '/set-pin')
        nav(nextRoute.startsWith('/set-pin') ? '/set-pin?mode=reset' : nextRoute, { replace: true })
        return
      }

      const result = await verifyRegistrationApi({ phone, otp })
      if (!result.ok || !result.user) throw new Error('Unable to verify OTP.')

      completeOtpSession({ id: result.user.id, phone: result.user.phone, name: flow.identity?.name, email: flow.identity?.email })
      setAuthFlowPinContext({
        flow: 'register',
        identifier: { phone: result.user.phone, email: flow.identity?.email },
        otpContext: {
          userId: result.userId || result.user.id,
          otpSessionId: result.otpSessionId,
          verificationToken: result.verificationToken,
          temporaryAuthToken: result.temporaryAuthToken
        }
      })
      nav(resolveNextRoute(result.next, '/set-pin'), { replace: true })
    } catch (e: any) {
      const bounded = Math.min(MAX_ATTEMPTS, attemptsUsed + 1)
      setAttemptsUsed(bounded)
      updateAuthFlowOtpSession({ attemptsUsed: bounded, resendEnabled: bounded >= MAX_ATTEMPTS })
      setError(e?.message || 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setInfo('')
    try {
      setLoading(true)
      if (mode === 'reset') {
        const response = await startPinReset({ phone, email })
        if (!response.ok) return setError(response.message || 'Unable to resend OTP right now.')
      } else {
        if (!flow.identity?.fullPhone || !flow.identity?.name) return setError('Missing registration details. Please register again.')
        await registerStart({
          mobile: flow.identity.fullPhone,
          email: flow.identity.email,
          name: flow.identity.name,
          countryCode: flow.identity.countryCode,
          location: null
        })
      }

      setAttemptsUsed(0)
      setOtp('')
      setAuthFlowOtpSession({ purpose: mode, attemptsUsed: 0, maxAttempts: MAX_ATTEMPTS, resendEnabled: false })
      setInfo('A new OTP has been sent. Please use the latest code.')
    } catch (e: any) {
      setError(e?.message || 'Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={72} />
        <h2>OTP Verification</h2>
        <p className="neo-auth-sub">Attempts left: {attemptsRemaining} / {MAX_ATTEMPTS}.</p>

        <input className="neo-control" placeholder="6-digit OTP" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} disabled={locked || loading} />
        <button className="neo-btn neo-btn-primary" onClick={handleVerify} disabled={loading || locked}>{loading ? 'Verifying…' : 'Verify & Continue'}</button>

        {(locked || error.toLowerCase().includes('expired')) && <button type="button" className="neo-btn neo-btn-link" onClick={handleResend} disabled={loading}>Resend OTP</button>}

        {error && <p className="error">{error}</p>}
        {info && <p className="neo-auth-sub">{info}</p>}
      </section>
    </main>
  )
}
