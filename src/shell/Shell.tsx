import { Link, Outlet, useNavigate } from 'react-router-dom'
import { currentUser, logout } from '../services/auth'
import MobileNav from '../components/navigation/MobileNav'

export default function Shell() {
  const u = currentUser()
  const nav = useNavigate()

  const doLogout = () => {
    logout()
    nav('/login', { replace: true })
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">Vyntaro</div>
        <nav className="nav">
          {!u && <Link to="/login">Login</Link>}
          {!u && <Link to="/register">Register</Link>}
          {u && <Link to="/dashboard">Overview</Link>}
          {u && <Link to="/dashboard/transactions">Transactions</Link>}
          {u && <Link to="/dashboard/budgets">Budgets</Link>}
          {u && <Link to="/dashboard/analytics">Analytics</Link>}
          {u && <Link to="/dashboard/profile">Profile</Link>}
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
