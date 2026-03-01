import { Link } from 'react-router-dom'
import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'

export default function BudgetOverview() {
  const { data } = useDashboardData()

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">Budget Overview</h2>
        <p className="dashboard-subtitle">Plan category caps and track usage before overrun happens.</p>
        {(data?.budgets ?? []).length === 0 ? <p className="dashboard-subtitle">No budget categories yet. Create your first budget now.</p> : (
          <div className="budgets-grid">
            {(data?.budgets ?? []).map(budget => {
              const usedPercent = Math.min(100, (budget.used / budget.total) * 100)
              return (
                <article key={budget.id} className="budget-card">
                  <div className="budget-row"><strong>{budget.name}</strong><span>{budget.used} / {budget.total}</span></div>
                  <div className="budget-track"><div className="budget-fill" style={{ width: `${usedPercent}%` }} /></div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      <section className="dashboard-card fade-in-up">
        <Link to="/dashboard/ledgerentry/new?type=expense" className="neo-btn neo-btn-primary">Add expense to update budget usage</Link>
      </section>
    </main>
  )
}
