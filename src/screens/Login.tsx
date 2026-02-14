import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithPin } from '../services/auth'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import { countryDialCodes } from '../lib/countryDialCodes'

const ATTEMPT_KEY = 'pin_login_attempts'
const MAX_ATTEMPTS = 5

function getRemainingAttempts() {
  const value = Number(localStorage.getItem(ATTEMPT_KEY) ?? MAX_ATTEMPTS)
  return Number.isNaN(value) ? MAX_ATTEMPTS : Math.max(0, value)
}

export default function Login() {
  const nav = useNavigate()
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locked, setLocked] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_ATTEMPTS)
  const pinRefs = useRef<Array<HTMLInputElement | null>>([])

  const pinValue = useMemo(() => pin.join(''), [pin])

  useEffect(() => {
    const attempts = getRemainingAttempts()
    setRemainingAttempts(attempts)
    setLocked(attempts <= 0)

    const savedPhone = localStorage.getItem('auth_phone')
    if (!savedPhone) return
    const dialCode = countryDialCodes.find(c => savedPhone.startsWith(c.dial))
    if (dialCode) {
      setCountryCode(dialCode.dial)
      setPhone(savedPhone.replace(dialCode.dial, ''))
    }
  }, [])

  useEffect(() => {
    if (phone.length >= 8) pinRefs.current[0]?.focus()
  }, [phone])

  const handlePinChange = (index: number, value: string) => {
    if (locked || loading) return
    const next = value.replace(/\D/g, '').slice(-1)
    setPin(prev => {
      const copy = [...prev]
      copy[index] = next
      return copy
    })
    if (next && index < 3) pinRefs.current[index + 1]?.focus()
  }

  const handlePinKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus()
    }
  }

  const handleDelete = () => {
    if (locked || loading) return
    setPin(['', '', '', ''])
    setError('')
    pinRefs.current[0]?.focus()
  }

  const handleSubmit = async () => {
    if (locked || loading) return
    setError('')

    if (!phone) return setError('Enter your mobile number to continue.')
    if (pinValue.length !== 4) return setError('Enter the full 4-digit PIN.')

    setLoading(true)
    const fullPhone = `${countryCode}${phone}`

    try {
      const res = await loginWithPin(fullPhone, pinValue)
      if (res.ok) {
        localStorage.setItem('auth_phone', fullPhone)
        localStorage.setItem(ATTEMPT_KEY, String(MAX_ATTEMPTS))
        nav('/dashboard', { replace: true })
        return
      }

      const nextAttempts = Math.max(0, getRemainingAttempts() - 1)
      localStorage.setItem(ATTEMPT_KEY, String(nextAttempts))
      setRemainingAttempts(nextAttempts)
      setLocked(nextAttempts <= 0)
      setError(nextAttempts <= 0 ? 'PIN locked due to too many attempts.' : 'Incorrect PIN. Try again.')
      setPin(['', '', '', ''])
      pinRefs.current[0]?.focus()
    } catch {
      setError('Unable to verify PIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetLink = `/forgot-pin?mobile=${encodeURIComponent(`${countryCode}${phone}`)}`

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={84} />
        <h2>Secure Login</h2>
        <p className="neo-auth-sub">
          Enter your registered number and 4-digit login PIN.
        </p>

        <div className="neo-phone-wrap">
          <select className="neo-control" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
            {countryDialCodes.map(country => (
              <option key={`${country.code}-${country.dial}`} value={country.dial}>
                {country.name} ({country.dial})
              </option>
            ))}
          </select>
          <input
            placeholder="Mobile number"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
          />
        </div>

        <div className="neo-pin-row">
          <div className="neo-pin-inputs">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={el => {
                  pinRefs.current[index] = el
                }}
                value={digit}
                disabled={locked || loading}
                inputMode="numeric"
                maxLength={1}
                onChange={e => handlePinChange(index, e.target.value)}
                onKeyDown={e => handlePinKeyDown(index, e)}
                className="neo-pin-input"
              />
            ))}
          </div>
          <button className="neo-pin-back" onClick={handleDelete} disabled={locked || loading} aria-label="Clear PIN">←</button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="neo-pin-actions">
          <button className="neo-btn neo-btn-primary" onClick={handleSubmit} disabled={locked || loading}>
            {loading ? 'Verifying...' : 'Submit'}
          </button>
        </div>

        {(locked || remainingAttempts === 0) && (
          <button className="neo-btn neo-btn-link" onClick={() => nav(resetLink)}>
            Reset PIN via OTP
          </button>
        )}

        {!locked && remainingAttempts > 0 && remainingAttempts < MAX_ATTEMPTS && (
          <p className="neo-auth-sub">
            {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
          </p>
        )}

        <button className="neo-btn neo-btn-ghost" onClick={() => nav('/register')}>
          New user? Register
        </button>
      </section>
    </main>
  )
}
