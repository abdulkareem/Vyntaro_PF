import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/adminApi'
import { setAdminSession } from '../../services/adminAuth'

export default function AdminLogin() {
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await adminService.login({ mobile, pin })
      const role = response.profile?.role
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        throw new Error('Access denied: admin role required')
      }
      setAdminSession(response.token, { name: response.profile?.name || 'Administrator', role })
      navigate('/admin/dashboard')
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="admin-login-screen">
      <form className="admin-login-card" onSubmit={onSubmit}>
        <h1>SuperAdmin Login</h1>
        <p>Secure access for system administration.</p>
        <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile" required />
        <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-digit PIN" maxLength={4} required />
        {error && <p className="error">{error}</p>}
        <button disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </section>
  )
}
