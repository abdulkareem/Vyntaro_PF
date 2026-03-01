import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import PinInput from '../components/auth/PinInput'
import { setNewPin, setPin } from '../services/auth'
import { resolveNextRoute } from '../services/authFlowNavigator'
import { clearAuthFlowState, getAuthFlowState } from '../services/authFlowState'

export default function SetPin() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const flowState = getAuthFlowState()

  const mobile = useMemo(() => {
    const fromQuery = sp.get('mobile') || flowState.pinContext?.identifier.phone || ''
    if (fromQuery) return fromQuery
    const verified = localStorage.getItem('verified_identity')
    if (!verified) return ''
    try {
      return (JSON.parse(verified) as { phone?: string }).phone || ''
    } catch {
      return ''
    }
  }, [sp])

  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const queryMode = sp.get('mode')
  const flow = queryMode === 'reset' || queryMode === 'register' ? queryMode : (flowState.pinContext?.flow ?? 'register')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!/^\d{4}$/.test(p1)) return setError('PIN must be exactly 4 digits.')
    if (p1 !== p2) return setError('PINs do not match.')

    setLoading(true)
    setError(null)

    try {
      if (flow === 'reset') {
        const result = await setNewPin(flowState.pinContext?.identifier || { phone: mobile }, p1)
        if (!result.ok) return setError(result.message || 'Failed to save new PIN.')
        clearAuthFlowState()
        nav(resolveNextRoute(result.next, '/login'), { replace: true })
        return
      }

      if (!mobile) return setError('Missing mobile number. Please restart verification.')
      const result = await setPin(mobile, p1)
      if (!result.ok) return setError(result.message || 'Failed to set PIN.')
      clearAuthFlowState()
      nav(resolveNextRoute(result.next, '/login'), { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={72} />
        <h2>{flow === 'reset' ? 'Set New PIN' : 'Create Login PIN'}</h2>
        <p className="neo-auth-sub">Use a secure 4-digit PIN.</p>

        <form onSubmit={submit} className="neo-form-stack">
          <input className="neo-control" value={mobile || flowState.pinContext?.identifier.email || 'Using your verified identity'} readOnly aria-label="Identity" />
          <PinInput value={p1} onChange={setP1} disabled={loading} />
          <PinInput value={p2} onChange={setP2} disabled={loading} />
          <button className="neo-btn neo-btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save PIN'}</button>
          {error && <p className="error">{error}</p>}
        </form>
      </section>
    </main>
  )
}
