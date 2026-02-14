import { useState } from 'react'
import { loginWithPin } from '../services/auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setHint(null)
    const r = await loginWithPin(mobile, pin)
    setLoading(false)
    if (r.ok) {
      nav('/dashboard', { replace: true })
    } else if (r.reason === 'device_unverified') {
      if (import.meta.env.DEV && r.needsOTP) setHint(`Dev device OTP: ${r.needsOTP}`)
      nav(`/verify?mobile=${encodeURIComponent(mobile)}&mode=device`)
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="section" id="login">
      <h2>Login</h2>
      <form onSubmit={submit} className="section-content" style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <input placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))} inputMode="numeric" pattern="\\d{7,15}" required />
        <input placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} required type="password" />
        <button type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
        <button type="button" onClick={() => nav('/forgot-pin')}>Forgot PIN?</button>
        {hint && <div style={{ color: 'var(--muted)' }}>{hint}</div>}
        {error && <div style={{ color: '#ff6c6c' }}>{error}</div>}
      </form>
    </div>
  )
}
