import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', icon: '🏠', label: 'Overview' },
  { to: '/dashboard/ledgerentry', icon: '🧾', label: 'Finance' },
  { to: '/dashboard/analytics', icon: '📊', label: 'Insights' },
  { to: '/dashboard/ledgerentry', icon: '📅', label: 'Bookings' },
  { to: '/dashboard/profile', icon: '👤', label: 'Profile' }
]

export default function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {items.map(item => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>
          <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
