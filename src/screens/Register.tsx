import { useEffect, useState } from 'react'
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

  const fullPhone = `${form.countryCode}${form.phone}`
  useEffect(() => {
    if (!form.phone || form.phone.length < 8) return

    const timer = setTimeout(async () => {
      try {
        const res = await checkIdentity({ mobile: fullPhone, email: form.email || undefined })
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
    if (!form.fullName) {
      setError('Please enter your full name.')
      return
    }

    const detectedLocation = await getCurrentLocation()
    setLocation(detectedLocation)
    setError('')
    setStep('contact')
  }

  async function continueToOtp() {
    if (!form.phone) {
      setError('Please enter your phone number.')
      return
    }

    if (identityStatus === 'exists') {
      nav(`/forgot-pin?mobile=${encodeURIComponent(fullPhone)}`)
      return
    }

    try {
      setLoading(true)
      await registerStart({ mobile: fullPhone, email: form.email, name: form.fullName, location })
      nav(`/verify?mobile=${encodeURIComponent(fullPhone)}&mode=register`)
    } catch (e: any) {
      setError(e?.message || 'Unable to continue registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={88} />
        <h2>Create your Vyntaro account</h2>

        {step === 'profile' ? (
          <>
            <input className="neo-control" placeholder="Full name" value={form.fullName} onChange={e => update('fullName', e.target.value)} />

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

            <input className="neo-control" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} />

            {identityStatus === 'exists' && <p className="neo-auth-sub" style={{ color: '#f59e0b' }}>Already registered — you can reset your PIN.</p>}
            {identityStatus === 'new' && <p className="neo-auth-sub" style={{ color: '#22c55e' }}>New account — continue registration.</p>}

            <button className="neo-btn neo-btn-primary" onClick={continueToOtp} disabled={loading}>
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </>
        )}

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  )
}
