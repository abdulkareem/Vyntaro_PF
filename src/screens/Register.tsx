import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import { countryDialCodes } from '../lib/countryDialCodes'
import { checkIdentity, registerStart } from '../services/auth'

export default function Register() {
  const nav = useNavigate()
  const [step, setStep] = useState<'profile' | 'contact'>('profile')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+91'
  })
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [identityStatus, setIdentityStatus] = useState<'unknown' | 'exists' | 'new'>('unknown')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const fullPhone = useMemo(() => `${form.countryCode}${form.phone}`, [form.countryCode, form.phone])

  useEffect(() => {
    if (!form.phone || form.phone.length < 8) return

    const timer = setTimeout(async () => {
      try {
        const email = form.email.trim()
        const res = await checkIdentity({ mobile: fullPhone, email: email || undefined })
        setIdentityStatus(res.exists ? 'exists' : 'new')
      } catch {
        setIdentityStatus('unknown')
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [form.phone, form.email, fullPhone])

  function getCurrentLocation(): Promise<{ lat: number; lon: number } | null> {
    if (!navigator.geolocation) return Promise.resolve(null)

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    })
  }

  async function continueToContact() {
    const normalizedName = form.fullName.trim()
    if (!normalizedName || normalizedName.length < 3) {
      setError('Please enter your full legal name as per your bank profile.')
      return
    }

    const detectedLocation = await getCurrentLocation()
    setLocation(detectedLocation)
    setError('')
    setStep('contact')
  }

  async function continueToOtp() {
    const normalizedEmail = form.email.trim()

    if (!form.phone || form.phone.length < 8) {
      setError('Please enter a valid mobile number.')
      return
    }

    if (normalizedEmail) {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      if (!validEmail) {
        setError('Please enter a valid email address.')
        return
      }
    }

    if (identityStatus === 'exists') {
      nav(`/forgot-pin?mobile=${encodeURIComponent(fullPhone)}`)
      return
    }

    try {
      setLoading(true)
      await registerStart({
        mobile: fullPhone,
        email: normalizedEmail || '',
        name: form.fullName.trim(),
        location
      })
      nav(`/verify?mobile=${encodeURIComponent(fullPhone)}&mode=register`)
    } catch (e: any) {
      const message = String(e?.message || '')
      if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('network')) {
        setError('Unable to reach the server. Please check API URL/network and retry. OTP can only be sent when server is reachable.')
      } else {
        setError(message || 'Unable to continue registration')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={88} />
        <h2>Create your personal finance account</h2>
        <p className="neo-auth-sub">Built for individual money management: secure onboarding, OTP verification, and PIN protection.</p>

        {step === 'profile' ? (
          <>
            <input
              className="neo-control"
              placeholder="Full legal name"
              value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
            />

            <p className="neo-auth-sub">This app supports only individual accounts. Business-owner registration is not required.</p>

            <button className="neo-btn neo-btn-primary" onClick={continueToContact}>Continue</button>
          </>
        ) : (
          <>
            <div className="neo-phone-wrap">
              <select className="neo-control" value={form.countryCode} onChange={e => update('countryCode', e.target.value)}>
                {countryDialCodes.map(country => (
                  <option key={`${country.code}-${country.dial}`} value={country.dial}>
                    {country.name} ({country.dial})
                  </option>
                ))}
              </select>
              <input
                className="neo-control"
                placeholder="Mobile number"
                value={form.phone}
                onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 15))}
              />
            </div>

            <input className="neo-control" placeholder="Email (optional)" value={form.email} onChange={e => update('email', e.target.value.trimStart())} />

            {identityStatus === 'exists' && <p className="neo-auth-sub" style={{ color: '#f59e0b' }}>Account already exists for this number. Continue to reset PIN.</p>}
            {identityStatus === 'new' && <p className="neo-auth-sub" style={{ color: '#22c55e' }}>New personal account detected. OTP will be sent to mobile, and to email when provided.</p>}

            <button className="neo-btn neo-btn-primary" onClick={continueToOtp} disabled={loading}>
              {loading ? 'Requesting OTP...' : 'Continue to OTP Verification'}
            </button>
          </>
        )}

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  )
}
