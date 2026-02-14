import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import { currentUser, updatePin } from '../services/auth'

export default function ChangePin() {
  const nav = useNavigate()
  const u = currentUser()
  const [oldPin, setOldPin] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const mobileLabel = useMemo(() => u?.mobile ?? 'Unknown user', [u?.mobile])

  const sanitizePin = (value: string) => value.replace(/\D/g, '').slice(0, 4)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (oldPin.length !== 4 || p1.length !== 4 || p2.length !== 4) {
      setError('All PIN fields must be exactly 4 digits.')
      return
    }

    if (p1 !== p2) {
      setError('New PIN and confirmation do not match.')
      return
    }

    if (!u?.mobile) {
      setError('No authenticated user found.')
      return
    }

    setLoading(true)
    const r = await updatePin(u.mobile, oldPin, p1)
    setLoading(false)

    if (r.ok) {
      setMessage('PIN updated successfully.')
      setOldPin('')
      setP1('')
      setP2('')
      return
    }

    setError(
      r.reason === 'not_supported'
        ? r.message ?? 'This flow is not available yet.'
        : r.reason === 'invalid'
          ? 'Current PIN is incorrect.'
          : 'Failed to update PIN. Please try again.'
    )
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card neo-auth-card-wide">
        <VyntaroLogoAnimated size={76} />
        <h2>Change Security PIN</h2>
        <p className="neo-auth-sub">Keep your account protected with a fresh 4-digit PIN.</p>

        <form onSubmit={submit} className="neo-form-stack">
          <div className="neo-note-chip">Account: {mobileLabel}</div>

          <input
            className="neo-control"
            placeholder="Current PIN"
            value={oldPin}
            onChange={e => setOldPin(sanitizePin(e.target.value))}
            inputMode="numeric"
            type="password"
          />
          <input
            className="neo-control"
            placeholder="New PIN"
            value={p1}
            onChange={e => setP1(sanitizePin(e.target.value))}
            inputMode="numeric"
            type="password"
          />
          <input
            className="neo-control"
            placeholder="Confirm New PIN"
            value={p2}
            onChange={e => setP2(sanitizePin(e.target.value))}
            inputMode="numeric"
            type="password"
          />

          {message && <p className="neo-success">{message}</p>}
          {error && <p className="error">{error}</p>}

          <div className="neo-pin-actions">
            <button type="submit" className="neo-btn neo-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save PIN'}
            </button>
            <button type="button" className="neo-btn neo-btn-ghost" onClick={() => nav('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
