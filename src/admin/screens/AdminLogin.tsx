import { FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { adminService } from '../../services/adminApi'
import { setAdminSession } from '../../services/adminAuth'
import { toUserFacingError } from '../../services/userMessage'

type AdminLocationState = {
  from?: string
}

export default function AdminLogin() {
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as AdminLocationState | null)?.from

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await adminService.login({ mobile: mobile.trim(), pin })
      const role = response.profile?.role
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') throw new Error('Access denied: admin role required')
      setAdminSession(response.token, { name: response.profile?.name || 'Administrator', role })
      navigate(from && from.startsWith('/admin') ? from : '/admin/dashboard', { replace: true })
    } catch (e: unknown) {
      setError(toUserFacingError(e, 'Unable to sign in. Please check your admin credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="admin-login-screen">
      <form className="admin-login-card" onSubmit={onSubmit}>
        <h1>SuperAdmin Login</h1>
        <p>Secure access for system administration.</p>
        <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))} placeholder="Mobile" required />
        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4-digit PIN" maxLength={4} required />
        {error && <p className="error">{error}</p>}
        <button disabled={loading || pin.length !== 4}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </section>
  )
}
