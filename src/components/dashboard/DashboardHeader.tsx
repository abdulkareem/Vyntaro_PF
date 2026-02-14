import { useTheme } from '../../hooks/useTheme'

type DashboardHeaderProps = {
  userName: string
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="dashboard-header">
      <div>
        <p className="dashboard-subtitle">Welcome back,</p>
        <h1 className="dashboard-title">{userName}</h1>
      </div>
      <div className="dashboard-header-actions">
        <button type="button" onClick={toggleTheme} className="theme-toggle-btn">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="dashboard-avatar">{userName.charAt(0)}</div>
      </div>
    </header>
  )
}
