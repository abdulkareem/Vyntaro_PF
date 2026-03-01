import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import { countryDialCodes } from '../lib/countryDialCodes'
import { setNewPin, startPinReset, verifyPinReset } from '../services/auth'

export default function ForgotPin() {
  const [sp] = useSearchParams()
  const nav = useNavigate()

  const initialCountry = sp.get('country') ?? '+91'
  const incomingMobile = sp.get('mobile') ?? sp.get('phone') ?? ''
  const [countryCode, setCountryCode] = useState(initialCountry)
  const [phone, setPhone] = useState(incomingMobile.startsWith(initialCountry) ? incomingMobile.replace(initialCountry, '') : incomingMobile)
  const [email, setEmail] = useState(sp.get('email') ?? '')
  const [step, setStep] = useState<'request' | 'verify' | 'set'>(sp.get('step') === 'verify' ? 'verify' : 'request')
  const [channel, setChannel] = useState<'phone' | 'email'>((sp.get('channel') as 'phone' | 'email') || 'phone')
  const [code, setCode] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRegisterLink, setShowRegisterLink] = useState(false)
  const [loading, setLoading] = useState(false)

  const fullPhone = `${countryCode}${phone}`

  const payload = useMemo(
    () => ({
      phone: channel === 'phone' ? fullPhone : undefined,
      email: channel === 'email' ? email.trim().toLowerCase() : undefined
    }),
    [channel, email, fullPhone]
  )

  const validateContactInput = () => {
    if (!phone || phone.length < 8) {
      setError('Please enter a valid mobile number.')
      return false
    }

    if (email.trim()) {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      if (!validEmail) {
        setError('Please enter a valid email address.')
        return false
      }
    }

    if (channel === 'email' && !email.trim()) {
      setError('Enter your registered email address.')
      return false
    }

    return true
  }

  const request = async () => {
    setError(null)
    setMessage(null)
    setShowRegisterLink(false)

    if (!validateContactInput()) return

    setLoading(true)
    const r = await startPinReset(payload)
    setLoading(false)

    if (r.ok) {
      if (import.meta.env.DEV && r.code) setMessage(`Dev OTP: ${r.code}`)
      else setMessage(`OTP sent to your ${channel}.`)
      setStep('verify')
      nav(`/forgot-pin?step=verify&channel=${channel}&country=${encodeURIComponent(countryCode)}&phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email.trim())}`, { replace: true })
      return
    }

    if (r.reason === 'not_found') {
      setError(channel === 'phone' ? 'No user found for this mobile number.' : 'No user found for this email address.')
      setShowRegisterLink(true)
      return
    }

    setError(r.message ?? 'Unable to send OTP.')
  }

  const verify = async () => {
    if (!code || code.length < 4) {
      setError('Enter the OTP sent to you.')
      return
    }

    setLoading(true)
    setError(null)
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
        <p className="neo-auth-sub">Use your registered mobile number or email to receive an OTP and set a new PIN.</p>

        {step === 'request' && (
          <>
            <div className="neo-phone-wrap">
              <select className="neo-control" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                {countryDialCodes.map(country => (
                  <option key={`${country.code}-${country.dial}`} value={country.dial}>
                    {country.name} ({country.dial})
                  </option>
                ))}
              </select>
              <input
                className="neo-control"
                placeholder="Registered mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
              />
            </div>

            <input className="neo-control" placeholder="Registered email" value={email} onChange={e => setEmail(e.target.value.trimStart())} />

            <div className="neo-chip-row">
              <button type="button" className={`neo-chip ${channel === 'phone' ? 'active' : ''}`} onClick={() => setChannel('phone')}>Send OTP to phone</button>
              <button type="button" className={`neo-chip ${channel === 'email' ? 'active' : ''}`} onClick={() => setChannel('email')}>Send OTP to email</button>
            </div>

            <button className="neo-btn neo-btn-primary" onClick={request} disabled={loading}>
              {loading ? 'Sending…' : 'Continue to OTP Verification'}
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="neo-auth-sub">OTP sent via {channel === 'phone' ? fullPhone : email.trim()}.</p>
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
