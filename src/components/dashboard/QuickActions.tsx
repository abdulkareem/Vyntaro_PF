import { Link } from 'react-router-dom'

const actions = [
  { name: 'Send', icon: '➡️', to: '/dashboard/transactions?action=send' },
  { name: 'Request', icon: '📥', to: '/dashboard/transactions?action=request' },
  { name: 'Add Funds', icon: '💰', to: '/dashboard/ledgerentry?action=add-funds' },
  { name: 'More', icon: '⋯', to: '/dashboard/profile?action=more' }
]

export default function QuickActions() {
  return (
    <div className="quick-actions-grid fade-in-up">
      {actions.map(action => (
        <Link key={action.name} className="quick-action-btn action-link" to={action.to}>
          <span className="quick-action-icon">{action.icon}</span>
          <span>{action.name}</span>
        </Link>
      ))}
    </div>
  )
}
