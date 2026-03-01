import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: '🏠 Home' },
  { to: '/dashboard/transactions', label: '🧾 Transactions' },
  { to: '/dashboard/ledgerentry', label: '📒 Ledger' },
  { to: '/dashboard/analytics', label: '📊 Insights' },
  { to: '/dashboard/profile', label: '👤 Profile' },
  { to: '/dashboard/budgets', label: '🎯 Budgets' }
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
