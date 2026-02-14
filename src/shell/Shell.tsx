import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { currentUser, logout } from '../services/auth'
import MobileNav from '../components/navigation/MobileNav'

export default function Shell() {
  const u = currentUser()
  const nav = useNavigate()
  const location = useLocation()

  const doLogout = () => {
    logout()
    nav('/login', { replace: true })
  }

  const onDashboardRoute = location.pathname.startsWith('/dashboard')

  return (
    <div className="app">
      <header className="header">
        <div className="brand">Vyntaro</div>
        <nav className="nav">
          {!u && <Link to="/login">Login</Link>}
          {!u && <Link to="/register">Register</Link>}
          {u && !onDashboardRoute && <Link to="/dashboard">Dashboard</Link>}
          {u && <button onClick={doLogout} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>Logout</button>}
        </nav>
      </header>
      <main style={{ padding: 0 }}>
        <Outlet />
      </main>
      {u && <MobileNav />}
      <footer className="footer">© {new Date().getFullYear()} Vyntaro</footer>
    </div>
  )
}
