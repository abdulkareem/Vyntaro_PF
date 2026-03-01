import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { currentUser, logout } from '../services/auth'
import MobileNav from '../components/navigation/MobileNav'
import { useTheme } from '../hooks/useTheme'

const authRoutes = new Set(['/login', '/register', '/verify', '/set-pin', '/forgot-pin'])

export default function Shell() {
  useTheme()
  const [authVersion, setAuthVersion] = useState(0)
  const u = currentUser()
  const nav = useNavigate()
  const location = useLocation()

  const doLogout = () => {
    logout()
    nav('/login', { replace: true })
  }

  useEffect(() => {
    const syncAuth = () => setAuthVersion(v => v + 1)
    window.addEventListener('auth-changed', syncAuth)
    window.addEventListener('storage', syncAuth)
    return () => {
      window.removeEventListener('auth-changed', syncAuth)
      window.removeEventListener('storage', syncAuth)
    }
  }, [])

  const onDashboardRoute = location.pathname.startsWith('/dashboard')
  const isAuthRoute = authRoutes.has(location.pathname)

  return (
    <div className="app" data-auth-version={authVersion}>
      {!isAuthRoute && (
        <header className="header">
          <div className="brand">Vyntaro</div>
          <nav className="nav">
            {u && !onDashboardRoute && <button className="header-btn" onClick={() => nav('/dashboard')}>Dashboard</button>}
            {u && <button className="header-btn" onClick={doLogout}>Logout</button>}
          </nav>
        </header>
      )}
      <main style={{ padding: 0 }}>
        <Outlet />
      </main>
      {u && <MobileNav />}
      {!isAuthRoute && <footer className="footer">© {new Date().getFullYear()} Vyntaro</footer>}
    </div>
  )
}
