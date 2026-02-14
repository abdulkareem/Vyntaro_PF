import { useEffect, useState } from 'react'
import { registerStart } from '../services/auth'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [loc, setLoc] = useState<{ lat: number; lon: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      p => setLoc({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => {}
    )
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await registerStart({ mobile, email, name, location: loc })
      nav(`/verify?mobile=${encodeURIComponent(mobile)}&mode=register`)
    } catch (err) {
      setError('Failed to start registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section" id="register">
      <h2>Register</h2>
      <form onSubmit={submit} className="section-content" style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))} inputMode="numeric" pattern="\\d{7,15}" required />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required type="email" />
        <button type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit'}</button>
        {loc && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Location captured: {loc.lat.toFixed(3)}, {loc.lon.toFixed(3)}</div>}
        {error && <div style={{ color: '#ff6c6c' }}>{error}</div>}
      </form>
    </div>
  )
}
