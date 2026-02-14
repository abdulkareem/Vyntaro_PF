import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resendRegistrationOTP, verifyDeviceOTP, verifyRegistrationOTP } from '../services/auth'

export default function Verify() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const mobile = sp.get('mobile') || ''
  const mode = sp.get('mode') || 'register'
  const isDevice = mode === 'device'
  const [phoneCode, setPhoneCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'register') {
      const codes = resendRegistrationOTP(mobile)
      if ((codes as any).error === 'throttled') {
        setMessage('Please wait before requesting OTP again')
      } else if (import.meta.env.DEV && codes.phoneCode && codes.emailCode) {
        setMessage(`Dev OTPs: phone ${codes.phoneCode}, email ${codes.emailCode}`)
      } else {
        setMessage('OTP sent to phone and email')
      }
    }
  }, [mobile, mode])

  const canSubmit = useMemo(() => {
    if (isDevice) return phoneCode.length === 6
    return phoneCode.length === 6 && emailCode.length === 6
  }, [isDevice, phoneCode, emailCode])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (isDevice) {
        const r = verifyDeviceOTP(mobile, phoneCode)
        if (!r.ok) setError('Invalid or expired code')
        else nav('/dashboard', { replace: true })
      } else {
        const r = await verifyRegistrationOTP(mobile, phoneCode, emailCode)
        if (!r.ok) setError('Invalid or expired codes')
        else nav(`/set-pin?mobile=${encodeURIComponent(mobile)}`, { replace: true })
      }
    } catch {
      setError('Invalid or expired codes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section" id="verify">
      <h2>{isDevice ? 'Verify Device' : 'Verify Registration'}</h2>
      <form onSubmit={submit} className="section-content" style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <div>Mobile: {mobile}</div>
        <input placeholder={isDevice ? 'OTP (phone)' : 'OTP (phone)'} value={phoneCode} onChange={e => setPhoneCode(e.target.value)} required />
        {!isDevice && <input placeholder="OTP (email)" value={emailCode} onChange={e => setEmailCode(e.target.value)} required />}
        <button type="submit" disabled={!canSubmit || loading}>{loading ? 'Verifying…' : 'Verify'}</button>
        {message && <div style={{ color: 'var(--muted)' }}>{message}</div>}
        {error && <div style={{ color: '#ff6c6c' }}>{error}</div>}
      </form>
    </div>
  )
}
