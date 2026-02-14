import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { setPin } from '../services/auth'

export default function SetPin() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const mobile = sp.get('mobile') || ''
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="section" id="set-pin">
      <h2>Set PIN</h2>
      <form onSubmit={submit} className="section-content" style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <div>Mobile: {mobile}</div>
        <input placeholder="PIN" value={p1} onChange={e => setP1(e.target.value)} required type="password" />
        <input placeholder="Confirm PIN" value={p2} onChange={e => setP2(e.target.value)} required type="password" />
        <button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        {error && <div style={{ color: '#ff6c6c' }}>{error}</div>}
      </form>
    </div>
  )
}
