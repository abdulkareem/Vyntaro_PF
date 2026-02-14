import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/dashboard/transactions', label: 'Transactions' },
  { to: '/dashboard/budgets', label: 'Budgets' },
  { to: '/dashboard/analytics', label: 'Analytics' },
  { to: '/dashboard/profile', label: 'Profile' }
]

export default function DashboardTabs() {
  return (
    <nav className="dashboard-tabs" aria-label="Dashboard pages">
      {tabs.map(tab => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `dashboard-tab${isActive ? ' active' : ''}`}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
