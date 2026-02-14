import { useState } from 'react'
import { setNewPin, startPinReset, verifyPinReset } from '../services/auth'
import { useNavigate } from 'react-router-dom'

export default function ForgotPin() {
  const [mobile, setMobile] = useState('')
  const [step, setStep] = useState<'request' | 'verify' | 'set'>('request')
  const [code, setCode] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const request = () => {
    setLoading(true); setError(null)
    const r = startPinReset(mobile)
    setLoading(false)
    if (r.ok) {
      if (import.meta.env.DEV && r.code) setMessage(`Dev OTP: ${r.code}`)
      else setMessage('OTP sent to your phone')
      setStep('verify')
    } else {
      setError(r.reason === 'not_found' ? 'User not found' : 'Please wait before requesting again')
    }
  }
  const verify = () => {
    setLoading(true); setError(null)
    const r = verifyPinReset(mobile, code)
    setLoading(false)
    if (r.ok) setStep('set')
    else setError('Invalid or expired code')
  }
  const save = async () => {
    if (p1 !== p2) { setError('PINs do not match'); return }
    setLoading(true); setError(null)
    const r = await setNewPin(mobile, p1)
    setLoading(false)
    if (r.ok) nav('/dashboard', { replace: true })
    else setError('Failed to reset PIN')
  }

  return (
    <div className="section" id="forgot-pin">
      <h2>Forgot PIN</h2>
      <div className="section-content" style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        {step === 'request' && (
          <>
            <input placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))} inputMode="numeric" pattern="[0-9]{7,15}" />
            <button onClick={request} disabled={loading}>{loading ? 'Sending…' : 'Send OTP'}</button>
          </>
        )}
        {step === 'verify' && (
          <>
            <div>Mobile: {mobile}</div>
            <input placeholder="OTP (phone)" value={code} onChange={e => setCode(e.target.value)} />
            <button onClick={verify} disabled={loading}>{loading ? 'Verifying…' : 'Verify'}</button>
          </>
        )}
        {step === 'set' && (
          <>
            <input placeholder="New PIN" value={p1} onChange={e => setP1(e.target.value)} type="password" />
            <input placeholder="Confirm PIN" value={p2} onChange={e => setP2(e.target.value)} type="password" />
            <button onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </>
        )}
        {message && <div style={{ color: 'var(--muted)' }}>{message}</div>}
        {error && <div style={{ color: '#ff6c6c' }}>{error}</div>}
      </div>
    </div>
  )
}
