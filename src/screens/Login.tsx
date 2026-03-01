import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithPin } from '../services/auth'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import PinInput from '../components/auth/PinInput'
import { clearAuthFlowState } from '../services/authFlowState'
import { resolveNextRoute } from '../services/authFlowNavigator'

export default function Login() {
  const nav = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState<'online_verified' | 'offline_authenticated' | null>(null)

  const isEmail = useMemo(() => identifier.includes('@'), [identifier])

  useEffect(() => {
    clearAuthFlowState()
  }, [])

  const handleSubmit = async () => {
    if (!identifier.trim()) return setError('Enter your registered phone number or email.')
    if (pin.length !== 4) return setError('Enter the full 4-digit PIN.')

    setError('')
    setLoading(true)

    try {
      const cleaned = identifier.trim()
      const res = await loginWithPin(cleaned, pin)
      if (res.ok) {
        setAuthMode(res.mode)
        localStorage.setItem('auth_phone', cleaned)
        localStorage.setItem('auth_user_mobile', res.user.mobile)
        localStorage.setItem('auth_user_id', res.user.id)
        localStorage.setItem('auth_user_email', res.user.email || '')
        nav(resolveNextRoute(res.next, '/dashboard'), { replace: true })
        return
      }

      if (res.reason === 'pin_not_set') {
        setError('PIN setup is required. Please complete setup first.')
        nav(`/set-pin?mobile=${encodeURIComponent(cleaned)}`)
        return
      }

      if (res.reason === 'offline_unavailable') {
        setError('Offline login is unavailable for this account on this device. Reconnect and try again.')
        return
      }

      setError('Invalid PIN. Please try again or reset your PIN.')
    } catch {
      setError('Unable to verify PIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={84} />
        <h2>Secure Login</h2>
        <p className="neo-auth-sub">Enter phone/email and your 4-digit PIN.</p>

        <input className="neo-control" placeholder="Phone or email" value={identifier} onChange={e => setIdentifier(e.target.value.trimStart())} />
        <PinInput value={pin} onChange={setPin} disabled={loading} />

        {error && <p className="error">{error}</p>}

        <button className="neo-btn neo-btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Verifying...' : 'Login'}
        </button>

        <button className="neo-btn neo-btn-link" onClick={() => nav(`/forgot-pin?${isEmail ? `email=${encodeURIComponent(identifier.trim())}` : `phone=${encodeURIComponent(identifier.trim())}`}`)}>
          Reset PIN
        </button>

        {authMode === 'offline_authenticated' && <p className="neo-auth-sub">Logged in using offline trust for this device.</p>}
        <button className="neo-btn neo-btn-ghost" onClick={() => nav('/register')}>New user? Register</button>
      </section>
    </main>
  )
}
