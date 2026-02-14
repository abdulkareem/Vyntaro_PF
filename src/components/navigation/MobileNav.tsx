import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Home' },
  { to: '/dashboard/transactions', label: 'Txns' },
  { to: '/dashboard/budgets', label: 'Budgets' },
  { to: '/dashboard/analytics', label: 'Charts' },
  { to: '/dashboard/profile', label: 'Profile' }
]

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {items.map(item => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
