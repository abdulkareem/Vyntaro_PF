import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import CountrySelect from '../components/auth/CountrySelect'
import { checkIdentity, registerStart } from '../services/auth'
import { resolveNextRoute } from '../services/authFlowNavigator'
import { setAuthFlowIdentity, setAuthFlowOtpSession } from '../services/authFlowState'

export default function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', countryCode: '+91' })
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [identityStatus, setIdentityStatus] = useState<'unknown' | 'exists' | 'new'>('unknown')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingIdentity, setCheckingIdentity] = useState(false)

  const fullPhone = useMemo(() => `${form.countryCode}${form.phone}`, [form.countryCode, form.phone])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function runIdentityCheck() {
    if (!form.phone || form.phone.length < 8) {
      setIdentityStatus('unknown')
      return 'unknown' as const
    }

    try {
      setCheckingIdentity(true)
      const email = form.email.trim().toLowerCase()
      const res = await checkIdentity({ mobile: fullPhone, email: email || undefined })
      const nextStatus = res.exists ? 'exists' : 'new'
      setIdentityStatus(nextStatus)
      return nextStatus
    } catch (e: any) {
      setIdentityStatus('unknown')
      setError(e?.message || 'Unable to verify account identity right now.')
      return 'unknown' as const
    } finally {
      setCheckingIdentity(false)
    }
  }

  useEffect(() => {
    if (!form.phone || form.phone.length < 8) {
      setIdentityStatus('unknown')
      return
    }

    const timer = setTimeout(() => {
      void runIdentityCheck()
    }, 500)

    return () => clearTimeout(timer)
  }, [form.phone, form.email, fullPhone])

  function getCurrentLocation(): Promise<{ lat: number; lon: number } | null> {
    if (!navigator.geolocation) return Promise.resolve(null)
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    })
  }

  function goToResetPin() {
    nav(`/forgot-pin?country=${encodeURIComponent(form.countryCode)}&phone=${encodeURIComponent(form.phone)}&email=${encodeURIComponent(form.email.trim())}`)
  }

  async function continueToOtp() {
    const normalizedEmail = form.email.trim().toLowerCase()

    if (form.fullName.trim().length < 3) return setError('Please enter your full legal name.')
    if (!form.phone || form.phone.length < 8) return setError('Please enter a valid mobile number.')
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setError('Please enter a valid email address.')

    setError('')
    const status = identityStatus === 'unknown' ? await runIdentityCheck() : identityStatus
    if (status === 'exists') return setError('An account already exists for this identity. Reset your PIN to continue.')
    if (status !== 'new') return setError('Unable to determine account state. Please try again.')

    try {
      setLoading(true)
      const detectedLocation = await getCurrentLocation()
      setLocation(detectedLocation)
      const start = await registerStart({
        mobile: fullPhone,
        email: normalizedEmail,
        name: form.fullName.trim(),
        location: detectedLocation,
        countryCode: form.countryCode
      })

      setAuthFlowIdentity({
        flow: 'register',
        countryCode: form.countryCode,
        phone: form.phone,
        fullPhone,
        email: normalizedEmail,
        name: form.fullName.trim()
      })
      setAuthFlowOtpSession({ purpose: 'register', attemptsUsed: 0, maxAttempts: 3, resendEnabled: false })

      const nextRoute = resolveNextRoute((start as { next?: string }).next, '/verify')
      nav(`${nextRoute}?mobile=${encodeURIComponent(fullPhone)}&mode=register`, { replace: true })
    } catch (e: any) {
      setError(e?.message || 'Unable to continue registration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={88} />
        <h2>Create your personal finance account</h2>
        <p className="neo-auth-sub">Identity → OTP → Set PIN. We always show your next safe action.</p>

        <input className="neo-control" placeholder="Full legal name" value={form.fullName} onChange={e => update('fullName', e.target.value)} />

        <div className="neo-phone-wrap">
          <CountrySelect value={form.countryCode} onChange={value => update('countryCode', value)} />
          <input className="neo-control" placeholder="Mobile number" value={form.phone} onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 15))} />
        </div>

        <input className="neo-control" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value.trimStart())} />

        {checkingIdentity && <p className="neo-auth-sub">Checking identity…</p>}
        {identityStatus === 'exists' && (
          <>
            <p className="neo-auth-sub" style={{ color: '#f59e0b' }}>This identity already exists.</p>
            <button type="button" className="neo-btn neo-btn-link" onClick={goToResetPin}>Reset PIN instead</button>
          </>
        )}

        <button className="neo-btn neo-btn-primary" onClick={continueToOtp} disabled={loading || checkingIdentity}>
          {loading ? 'Requesting OTP…' : 'Continue to OTP Verification'}
        </button>

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  )
}
