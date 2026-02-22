import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearAdminSession, getAdminProfile } from '../../services/adminAuth'

const menu = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Roles & Permissions', to: '/admin/roles' },
  { label: 'Database Control', to: '/admin/database' },
  { label: 'Activity Logs', to: '/admin/activity' },
  { label: 'Settings', to: '/admin/settings' }
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const profile = getAdminProfile()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">Vyntaro SuperAdmin</div>
        <nav>
          {menu.map((item) => (
            <Link key={item.to} to={item.to} className={location.pathname.startsWith(item.to) ? 'active' : ''}>{item.label}</Link>
          ))}
          <button onClick={() => { clearAdminSession(); navigate('/admin/login') }}>Logout</button>
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <input placeholder="Search users / email / mobile" />
          <div className="admin-header-right">
            <button className="icon-btn">🔔</button>
            <div className="admin-profile">{profile?.name ?? 'SuperAdmin'} • {profile?.role ?? 'superadmin'}</div>
          </div>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  )
}
