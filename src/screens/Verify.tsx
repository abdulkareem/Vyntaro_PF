import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import { verifyRegistrationApi } from '../services/api/authApi'
import { completeOtpSession } from '../services/auth'

type VerifiedIdentity = {
  phone: string
}

export default function Verify() {
  const [sp] = useSearchParams()
  const nav = useNavigate()

  const phone = sp.get('phone') || sp.get('mobile') || ''
  const mode = sp.get('mode') ?? 'register'

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!phone) {
      setError('Missing phone number')
    }
  }, [phone])

  async function verifyOtp() {
    if (!otp || !phone) return

    try {
      setLoading(true)
      setError('')
      setInfo('')

      const result = await verifyRegistrationApi({
        phone,
        otp
      })

      if (!result.ok || !result.user) {
        throw new Error('OTP verification failed')
      }

      const verified: VerifiedIdentity = {
        phone: result.user.phone
      }

      localStorage.setItem('verified_identity', JSON.stringify(verified))

      localStorage.setItem('auth_user_mobile', result.user.phone)
      localStorage.setItem('auth_user_id', result.user.id)
      localStorage.setItem('auth_user_email', result.user.email || '')

      if (mode === 'register') {
        // complete local session for UI continuity
        const pendingRegistration = localStorage.getItem('pending_registration')
        let pendingName: string | undefined
        let pendingEmail: string | undefined

        if (pendingRegistration) {
          try {
            const parsed = JSON.parse(pendingRegistration)
            pendingName = parsed?.name
            pendingEmail = parsed?.email
          } catch {
            // ignore
          }
        }

        completeOtpSession({
          id: result.user.id,
          phone: verified.phone,
          name: pendingName,
          email: pendingEmail
        })

        // backend says where to go next
        nav(result.next || '/set-pin', { replace: true })
        return
      }

      // fallback
      nav('/dashboard', { replace: true })
    } catch (e: any) {
      setError(e?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={72} />

        <h2>Enter OTP</h2>
        <p className="neo-auth-sub">
          Enter the 6-digit code sent to your registered mobile number (and email if provided).
        </p>

        <input
          className="neo-control"
          placeholder="6-digit OTP"
          maxLength={6}
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
        />

        {error && <p className="error">{error}</p>}
        {info && <p className="neo-auth-sub">{info}</p>}

        <button
          className="neo-btn neo-btn-primary"
          onClick={verifyOtp}
          disabled={loading}
        >
          {loading ? 'Verifying…' : 'Verify & Continue'}
        </button>
      </section>
    </main>
  )
}
