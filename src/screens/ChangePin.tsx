import { useState } from 'react'
import { currentUser, updatePin } from '../services/auth'

export default function ChangePin() {
  const u = currentUser()
  const [oldPin, setOldPin] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (p1 !== p2) { setError('PINs do not match'); return }
    setLoading(true); setError(null); setMessage(null)
    const r = await updatePin(u!.mobile, oldPin, p1)
    setLoading(false)
    if (r.ok) setMessage('PIN updated')
    else setError(r.reason === 'not_supported' ? (r.message ?? 'This flow is not available yet.') : (r.reason === 'invalid' ? 'Current PIN incorrect' : 'Failed to update PIN'))
  }

  return (
    <div className="section" id="change-pin">
      <h2>Change PIN</h2>
      <form onSubmit={submit} className="section-content" style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <div>Mobile: {u?.mobile}</div>
        <input placeholder="Current PIN" value={oldPin} onChange={e => setOldPin(e.target.value)} type="password" />
        <input placeholder="New PIN" value={p1} onChange={e => setP1(e.target.value)} type="password" />
        <input placeholder="Confirm PIN" value={p2} onChange={e => setP2(e.target.value)} type="password" />
        <button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        {message && <div style={{ color: 'var(--muted)' }}>{message}</div>}
        {error && <div style={{ color: '#ff6c6c' }}>{error}</div>}
      </form>
    </div>
  )
}
