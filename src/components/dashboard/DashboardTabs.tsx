import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/dashboard', label: 'Home' },
  { to: '/dashboard/transactions', label: 'Shops' },
  { to: '/dashboard/ledgerentry', label: 'LedgerEntry' },
  { to: '/dashboard/analytics', label: 'Insights' },
  { to: '/dashboard/profile', label: 'Profile' },
  { to: '/dashboard/profile?tab=settings', label: 'Settings' }
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
