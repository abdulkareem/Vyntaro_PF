import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import { setPin } from '../services/auth'

export default function SetPin() {
  const [sp] = useSearchParams()
  const nav = useNavigate()

  const mobile = useMemo(() => {
    const fromQuery = sp.get('mobile') || ''
    if (fromQuery) return fromQuery

    const verified = localStorage.getItem('verified_identity')
    if (!verified) return ''

    try {
      const parsed = JSON.parse(verified) as { phone?: string }
      return parsed.phone || ''
    } catch {
      return ''
    }
  }, [sp])

  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mobile) {
      setError('Missing mobile number. Please restart verification.')
      return
    }

    if (!/^\d{4}$/.test(p1)) {
      setError('PIN must be exactly 4 digits.')
      return
    }

    if (p1 !== p2) {
      setError('PINs do not match')
      return
    }

    setLoading(true)
    setError(null)
    const r = await setPin(mobile, p1)
    setLoading(false)

    if (!r.ok) setError('Failed to set PIN')
    else nav('/dashboard', { replace: true })
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={72} />
        <h2>Create Login PIN</h2>
        <p className="neo-auth-sub">Use a secure 4-digit PIN to complete setup.</p>

        <form onSubmit={submit} className="neo-form-stack">
          <input className="neo-control" value={mobile} readOnly aria-label="Mobile" />
          <input className="neo-control" placeholder="4-digit PIN" value={p1} onChange={e => setP1(e.target.value.replace(/\D/g, '').slice(0, 4))} required inputMode="numeric" type="password" />
          <input className="neo-control" placeholder="Confirm PIN" value={p2} onChange={e => setP2(e.target.value.replace(/\D/g, '').slice(0, 4))} required inputMode="numeric" type="password" />
          <button className="neo-btn neo-btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save PIN'}</button>
          {error && <p className="error">{error}</p>}
        </form>
      </section>
    </main>
  )
}
