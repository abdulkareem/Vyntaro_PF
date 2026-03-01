import { useEffect, useMemo, useState } from 'react'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import { currentUser, requestProfileUpdateOtp, updateProfile, verifyProfileUpdateOtp } from '../services/auth'
import { toUserFacingError } from '../services/userMessage'

export default function Profile() {
  const [user, setUser] = useState(currentUser())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [email, setEmail] = useState(user?.email ?? '')
  const [mobile, setMobile] = useState(user?.mobile ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const syncUser = () => {
      const latest = currentUser()
      setUser(latest)
      setEmail(latest?.email ?? '')
      setMobile(latest?.mobile ?? '')
      setAvatarUrl(latest?.avatarUrl ?? '')
    }

    window.addEventListener('auth-changed', syncUser)
    return () => window.removeEventListener('auth-changed', syncUser)
  }, [])

  const hasChanges = useMemo(
    () => email !== (user?.email ?? '') || mobile !== (user?.mobile ?? '') || avatarUrl !== (user?.avatarUrl ?? ''),
    [avatarUrl, email, mobile, user?.avatarUrl, user?.email, user?.mobile]
  )

  const sendOtp = async () => {
    if (!user) {
      setError('Please sign in again to update profile settings.')
      return
    }

    setLoading(true)
    setError(null)
    setStatus(null)
    try {
      const res = await requestProfileUpdateOtp({ mobile: user.mobile, email: user.email || undefined })
      setStatus(import.meta.env.DEV && res.code ? `Developer OTP: ${res.code}` : 'OTP sent to your registered contact.')
    } catch (e: unknown) {
      setError(toUserFacingError(e, 'Failed to send verification OTP.'))
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!user) {
      setError('Please sign in again to continue.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await verifyProfileUpdateOtp({ mobile: user.mobile, email: user.email || undefined, otp })
      setOtpToken(res.token || otp)
      setStatus('OTP verified. You can save profile updates now.')
    } catch (e: unknown) {
      setError(toUserFacingError(e, 'Invalid OTP. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const saveChanges = async () => {
    if (!otpToken) {
      setError('Verify OTP before updating settings.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await updateProfile({ email, mobile, avatarUrl, otpToken })
      setUser(currentUser())
      setStatus('Profile updated successfully.')
      setOtp('')
      setOtpToken('')
      setSettingsOpen(false)
    } catch (e: unknown) {
      setError(toUserFacingError(e, 'Failed to update profile settings.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Profile</h2>
      <article className="dashboard-card fade-in-up">
        <p className="dashboard-subtitle">Name</p>
        <p className="profile-value">{user?.name ?? 'Guest User'}</p>
      </article>
      <article className="dashboard-card fade-in-up">
        <p className="dashboard-subtitle">Email</p>
        <p className="profile-value">{user?.email ?? 'Not available'}</p>
      </article>
      <article className="dashboard-card fade-in-up">
        <p className="dashboard-subtitle">Mobile</p>
        <p className="profile-value">{user?.mobile ?? 'Not available'}</p>
      </article>
      <article className="dashboard-card fade-in-up">
        <button className="neo-btn neo-btn-primary" onClick={() => setSettingsOpen(v => !v)}>
          {settingsOpen ? 'Close Settings' : 'Settings & Verification'}
        </button>

        {settingsOpen && (
          <div className="neo-form-stack" style={{ marginTop: 12 }}>
            <input className="neo-control" placeholder="Update Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="neo-control" placeholder="Update Mobile" value={mobile} onChange={e => setMobile(e.target.value.replace(/[^\d+]/g, '').slice(0, 16))} />
            <input className="neo-control" placeholder="Profile Photo URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
            <button className="neo-btn neo-btn-ghost" onClick={sendOtp} disabled={loading}>Send OTP</button>
            <input className="neo-control" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <button className="neo-btn neo-btn-ghost" onClick={verifyOtp} disabled={loading || otp.length < 6}>Verify OTP</button>
            <button className="neo-btn neo-btn-primary" onClick={saveChanges} disabled={loading || !hasChanges || !otpToken}>Save Changes</button>
          </div>
        )}

        {status && <p className="neo-success">{status}</p>}
        {error && <p className="error">{error}</p>}
      </article>
    </main>
  )
}
