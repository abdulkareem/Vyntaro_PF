import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import { setNewPin, startPinReset, verifyPinReset } from '../services/auth'

type ResetMode = 'phone' | 'email'

export default function ForgotPin() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const [mode, setMode] = useState<ResetMode>('phone')
  const [identifier, setIdentifier] = useState(sp.get('mobile') ?? sp.get('phone') ?? '')
  const [step, setStep] = useState<'request' | 'verify' | 'set'>('request')
  const [code, setCode] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRegisterLink, setShowRegisterLink] = useState(false)
  const [loading, setLoading] = useState(false)

  const payload = useMemo(() => (
    mode === 'phone'
      ? { phone: identifier }
      : { email: identifier.trim().toLowerCase() }
  ), [identifier, mode])

  const request = async () => {
    if (!identifier.trim()) {
      setError(`Enter your ${mode}.`)
      return
    }

    setLoading(true)
    setError(null)
    setShowRegisterLink(false)
    const r = await startPinReset(payload)
    setLoading(false)

    if (r.ok) {
      if (import.meta.env.DEV && r.code) setMessage(`Dev OTP: ${r.code}`)
      else setMessage(`OTP sent to your ${mode}`)
      setStep('verify')
      return
    }

    if (r.reason === 'not_found') {
      setError(`This ${mode} is not registered.`)
      setShowRegisterLink(true)
      return
    }

    setError(r.message ?? 'Unable to send OTP.')
  }

  const verify = async () => {
    setLoading(true)
    setError(null)
    setShowRegisterLink(false)
    const r = await verifyPinReset(payload, code)
    setLoading(false)

    if (r.ok) setStep('set')
    else setError(r.message ?? 'Invalid or expired code')
  }

  const save = async () => {
    if (p1 !== p2) {
      setError('PINs do not match')
      return
    }

    if (!/^\d{4}$/.test(p1)) {
      setError('PIN must be exactly 4 digits.')
      return
    }

    setLoading(true)
    setError(null)
    setShowRegisterLink(false)
    const r = await setNewPin(payload, p1)
    setLoading(false)

    if (r.ok) nav('/login', { replace: true })
    else setError(r.message ?? 'Failed to reset PIN')
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={76} />
        <h2>Reset PIN</h2>
        <p className="neo-auth-sub">Reset your PIN using OTP verification with phone or email.</p>

        {step === 'request' && (
          <>
            <div className="neo-chip-row">
              <button className={`neo-chip ${mode === 'phone' ? 'active' : ''}`} onClick={() => { setMode('phone'); setIdentifier('') }} type="button">Phone</button>
              <button className={`neo-chip ${mode === 'email' ? 'active' : ''}`} onClick={() => { setMode('email'); setIdentifier('') }} type="button">Email</button>
            </div>
            <input
              className="neo-control"
              placeholder={mode === 'phone' ? 'Registered phone' : 'Registered email'}
              value={identifier}
              onChange={e => setIdentifier(
                mode === 'phone'
                  ? e.target.value.replace(/\D/g, '').slice(0, 15)
                  : e.target.value.trimStart()
              )}
            />
            <button className="neo-btn neo-btn-primary" onClick={request} disabled={loading}>{loading ? 'Sending…' : 'Send OTP'}</button>
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="neo-auth-sub">OTP sent to {identifier}</p>
            <input className="neo-control" placeholder="Enter OTP" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <button className="neo-btn neo-btn-primary" onClick={verify} disabled={loading}>{loading ? 'Verifying…' : 'Verify OTP'}</button>
          </>
        )}

        {step === 'set' && (
          <>
            <input className="neo-control" placeholder="New 4-digit PIN" value={p1} onChange={e => setP1(e.target.value.replace(/\D/g, '').slice(0, 4))} type="password" />
            <input className="neo-control" placeholder="Confirm PIN" value={p2} onChange={e => setP2(e.target.value.replace(/\D/g, '').slice(0, 4))} type="password" />
            <button className="neo-btn neo-btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save New PIN'}</button>
          </>
        )}

        {message && <p className="neo-auth-sub">{message}</p>}
        {error && <p className="error">{error}</p>}
        {showRegisterLink && step === 'request' && (
          <p className="neo-auth-sub">
            New here? <Link to="/register">Register now</Link>
          </p>
        )}

      </section>
    </main>
  )
}
