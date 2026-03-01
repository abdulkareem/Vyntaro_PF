import { useEffect, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'

type DashboardHeaderProps = {
  userName: string
  profilePhoto: string
}

type UiLanguage = 'en' | 'es' | 'ar'

function getInitialLanguage(): UiLanguage {
  const saved = localStorage.getItem('ui-language')
  if (saved === 'en' || saved === 'es' || saved === 'ar') return saved
  return 'en'
}

export default function DashboardHeader({ userName, profilePhoto }: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const [language, setLanguage] = useState<UiLanguage>(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('ui-language', language)
  }, [language])

  return (
    <header className="dashboard-header fade-in-up" role="banner">
      <div className="dashboard-header-left">
        <div>
          <p className="dashboard-subtitle">Good to see you,</p>
          <h1 className="dashboard-title">{userName}</h1>
        </div>
        <span className="balance-preview-chip" aria-label="Quick balance preview">Live wallet overview</span>
      </div>

      <label className="dashboard-search" aria-label="Global search">
        <span>🔎</span>
        <input type="search" placeholder="Search transactions, stores, bookings" />
      </label>

      <div className="dashboard-header-actions">
        <label className="language-toggle" aria-label="Language selector">
          <span>🌐</span>
          <select value={language} onChange={event => setLanguage(event.target.value as UiLanguage)}>
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="ar">AR</option>
          </select>
        </label>
        <button type="button" onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button type="button" className="header-icon-btn" aria-label="Notifications">🔔</button>
        <button type="button" className="quick-booking-btn">Quick Booking</button>
        <img src={profilePhoto} alt={`${userName} profile`} className="dashboard-avatar-image" />
      </div>
    </header>
  )
}
