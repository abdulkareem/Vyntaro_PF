import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import VyntaroLogoAnimated from '../components/brand/VyntaroLogoAnimated'
import { requestOtpApi, verifyOtpApi } from '../services/api/authApi'

type VerifiedIdentity = {
  userId?: string
  phone: string
  email?: string
  profileExists?: boolean
  identityExists?: boolean
  action?: string
  token?: string
}

export default function Verify() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const phone = sp.get('phone') || sp.get('mobile') || ''
  const mode = sp.get('mode') ?? 'register'

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [showResetLink, setShowResetLink] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!cooldown) return
    const timer = setInterval(() => setCooldown(v => Math.max(0, v - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function verifyOtp() {
    if (!otp || !phone) return

    try {
      setError('')
      setInfo('')
      setShowResetLink(false)

      const res = await verifyOtpApi({ phone, otp }) as VerifiedIdentity
      localStorage.setItem('verified_identity', JSON.stringify(res))

      if (res.token) document.cookie = `access_token=${res.token}; path=/`

      if (res.identityExists && res.action === 'RESET_PIN') {
        setInfo('This mobile/email is already registered. Set a new PIN to continue.')
        setShowResetLink(true)
        return
      }

      if (mode === 'reset-pin') {
        nav(`/set-pin?mobile=${encodeURIComponent(phone)}&reset=1`, { replace: true })
        return
      }

      if (!res.profileExists) {
        nav(`/set-pin?mobile=${encodeURIComponent(phone)}`, { replace: true })
        return
      }

      nav('/dashboard', { replace: true })
    } catch (e: any) {
      setAttempts(v => v + 1)
      setError(e?.message || 'Invalid OTP')
    }
  }

  async function resendOtp() {
    if (!phone || cooldown > 0) return

    try {
      await requestOtpApi({ phone, resend: true })
      setAttempts(0)
      setCooldown(30)
      setError('')
      setInfo('A new OTP has been sent.')
    } catch (e: any) {
      setError(e?.message || 'Failed to resend OTP')
    }
  }

  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <VyntaroLogoAnimated size={72} />
        <h2>Enter OTP</h2>
        <p className="neo-auth-sub">Use the 6-digit code sent to your registered channels.</p>

        <input
          className="neo-control"
          placeholder="6-digit OTP"
          maxLength={6}
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
        />

        {error && <p className="error">{error}</p>}
        {info && <p className="neo-auth-sub" style={{ color: '#f59e0b' }}>{info}</p>}

        {showResetLink && (
          <button className="neo-btn neo-btn-link" onClick={() => nav(`/forgot-pin?mobile=${encodeURIComponent(phone)}`)}>
            Mobile/email already registered — Set new PIN
          </button>
        )}

        <button className="neo-btn neo-btn-primary" onClick={verifyOtp}>
          Verify & Continue
        </button>

        {attempts >= 2 && (
          <button className="neo-btn neo-btn-link" disabled={cooldown > 0} onClick={resendOtp}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
          </button>
        )}
      </section>
    </main>
  )
}
