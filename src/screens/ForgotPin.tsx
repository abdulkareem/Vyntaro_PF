import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import CountrySelect from '../components/auth/CountrySelect'
import { startPinReset } from '../services/auth'
import { resolveNextRoute } from '../services/authFlowNavigator'
import { setAuthFlowIdentity, setAuthFlowOtpSession, setAuthFlowPinContext } from '../services/authFlowState'

export default function ForgotPin() {
  const [sp] = useSearchParams()
  const nav = useNavigate()

  const initialCountry = sp.get('country') ?? '+91'
  const incomingPhone = sp.get('phone') ?? sp.get('mobile') ?? ''
  const [countryCode, setCountryCode] = useState(initialCountry)
  const [phone, setPhone] = useState(incomingPhone.startsWith(initialCountry) ? incomingPhone.replace(initialCountry, '') : incomingPhone)
  const [email, setEmail] = useState(sp.get('email') ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRegisterLink, setShowRegisterLink] = useState(false)
  const [loading, setLoading] = useState(false)

  const fullPhone = `${countryCode}${phone}`
  const identifier = useMemo(() => {
    const normalizedEmail = email.trim().toLowerCase()
    if (normalizedEmail) return { email: normalizedEmail, phone: fullPhone }
    return { phone: fullPhone, email: undefined }
  }, [email, fullPhone])

  const request = async () => {
    setError(null)
    setMessage(null)
    setShowRegisterLink(false)

    if (!phone || phone.length < 8) return setError('Please enter a valid mobile number.')
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address.')

    setLoading(true)
    const r = await startPinReset(identifier)
    setLoading(false)

    if (!r.ok) {
      if (r.reason === 'not_found') {
        setError(r.code === 'ACCOUNT_NOT_FOUND' ? 'No account found. Check details or register.' : (r.message || 'No account found.'))
        setShowRegisterLink(true)
        return
      }
      if (r.reason === 'throttled') return setError(r.message || 'Too many requests. Please wait and try again.')
      return setError(r.message || 'Unable to start PIN reset.')
    }

    if (import.meta.env.DEV && r.code) setMessage(`Dev OTP: ${r.code}`)
    else setMessage('OTP sent. Continue to verification.')

    setAuthFlowIdentity({ flow: 'reset', countryCode, phone, fullPhone, email: email.trim().toLowerCase() || undefined })
    setAuthFlowPinContext({ flow: 'reset', identifier })
    setAuthFlowOtpSession({ purpose: 'reset', attemptsUsed: 0, maxAttempts: 3, resendEnabled: false })

    const next = resolveNextRoute(r.next, '/verify')
    nav(`${next}?mode=reset&mobile=${encodeURIComponent(fullPhone)}`, { replace: true })
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={76} />
        <h2>Reset PIN</h2>
        <p className="neo-auth-sub">Reset Start → OTP Verify → PIN Set → Login.</p>

        <div className="neo-phone-wrap">
          <CountrySelect value={countryCode} onChange={setCountryCode} disabled={loading} />
          <input className="neo-control" placeholder="Registered mobile number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))} />
        </div>
        <input className="neo-control" placeholder="Registered email" value={email} onChange={e => setEmail(e.target.value.trimStart())} />

        <button className="neo-btn neo-btn-primary" onClick={request} disabled={loading}>{loading ? 'Sending…' : 'Continue to OTP Verification'}</button>

        {message && <p className="neo-auth-sub">{message}</p>}
        {error && <p className="error">{error}</p>}
        {showRegisterLink && <p className="neo-auth-sub">New here? <Link to="/register">Register now</Link></p>}
      </section>
    </main>
  )
}
