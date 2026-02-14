const actions = [
  { name: 'Send', icon: '➡️' },
  { name: 'Request', icon: '📥' },
  { name: 'Add Funds', icon: '💰' },
  { name: 'More', icon: '⋯' }
]

export default function QuickActions() {
  return (
    <div className="quick-actions-grid fade-in-up">
      {actions.map(action => (
        <button key={action.name} className="quick-action-btn" type="button">
          <span className="quick-action-icon">{action.icon}</span>
          <span>{action.name}</span>
        </button>
      ))}
    </div>
  )
}
