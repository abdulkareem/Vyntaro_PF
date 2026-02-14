import { useTheme } from '../../hooks/useTheme'

type DashboardHeaderProps = {
  userName: string
  profilePhoto: string
}

export default function DashboardHeader({ userName, profilePhoto }: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="dashboard-header fade-in-up">
      <div>
        <p className="dashboard-subtitle">Welcome back,</p>
        <h1 className="dashboard-title">{userName}</h1>
      </div>
      <div className="dashboard-header-actions">
        <button type="button" onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <img src={profilePhoto} alt={`${userName} profile`} className="dashboard-avatar-image" />
      </div>
    </header>
  )
}
