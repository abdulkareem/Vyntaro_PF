import { useNavigate } from 'react-router-dom'
import { useDashboardData } from '../hooks/useDashboardData'

const entryTypes = [
  { id: 'expense', title: 'Add Money Outflow', subtitle: 'Track daily spending and business outflows.', icon: '💸' },
  { id: 'income', title: 'Add Money In Flow', subtitle: 'Log salary, freelance credits, and cash inflows.', icon: '💰' },
  { id: 'bill', title: 'Scan the Bill', subtitle: 'Capture bills quickly and auto-fill amount details.', icon: '📷' },
  { id: 'ledger', title: 'Add Inflow / Outflow', subtitle: 'Choose money inflow or outflow in one focused form.', icon: '📒' },
  { id: 'loan', title: 'Track Loan / Money Lent', subtitle: 'Record loan money lent and repayment tracking entries.', icon: '🤝' }
] as const

export default function LedgerEntry() {
  const navigate = useNavigate()
  const { data, loading, error, refresh, retryable } = useDashboardData()
  const budgets = data?.budgets ?? []

  const openEntryForm = (type: string) => {
    navigate(`/dashboard/ledgerentry/new?type=${encodeURIComponent(type)}`)
  }

  return (
    <main className="dashboard-page">
      <div className="ledger-form-header">
        <h2 className="screen-title">Ledger</h2>
        <button type="button" className="header-btn" onClick={() => navigate('/dashboard')}>Back</button>
      </div>
      <p className="dashboard-subtitle">Fast, clear, and habit-building entries for every money movement.</p>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Create New Entry</h3>
        <div className="entry-type-grid">
          {entryTypes.map(type => (
            <button key={type.id} type="button" className="entry-type-card" onClick={() => openEntryForm(type.id)}>
              <span className="entry-type-icon">{type.icon}</span>
              <strong>{type.title}</strong>
              <span>{type.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <section className="dashboard-card fade-in-up skeleton-card">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </section>
      )}

      {!loading && error && (
        <section className="dashboard-card fade-in-up">
          <p className="error">{error}</p>
          {retryable ? <button className="neo-btn neo-btn-link" type="button" onClick={() => void refresh()}>Retry</button> : null}
        </section>
      )}

      {!loading && !error && (
        <section className="dashboard-card fade-in-up">
          <h3 className="card-heading">Monthly Category Progress</h3>
          <p className="dashboard-subtitle">Use this to identify overspending early and stay on course.</p>
          {budgets.length === 0 ? (
            <p className="dashboard-subtitle">No categories yet.</p>
          ) : (
            <div className="budgets-grid">
              {budgets.map(budget => {
                const usedPercent = Math.min(100, (budget.used / budget.total) * 100)
                return (
                  <article key={budget.id} className="budget-card">
                    <div className="budget-row">
                      <strong>{budget.name}</strong>
                      <span>₹{budget.used} / ₹{budget.total}</span>
                    </div>
                    <div className="budget-track">
                      <div className="budget-fill" style={{ width: `${usedPercent}%` }} />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </main>
  )
}
