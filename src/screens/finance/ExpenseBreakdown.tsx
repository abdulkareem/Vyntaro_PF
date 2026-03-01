import { Link } from 'react-router-dom'
import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency, resolveCurrencyCode } from '../../lib/finance'

export default function ExpenseBreakdown() {
  const { data } = useDashboardData()
  const breakdown = data?.insights.expenseBreakdown ?? []
  const currencyCode = resolveCurrencyCode()

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">Expense Breakdown</h2>
        <p className="dashboard-subtitle">Drill into high-spend categories and find optimization opportunities.</p>
        {breakdown.length === 0 ? <p className="dashboard-subtitle">No expenses yet. Add spending entries to unlock category analytics.</p> : (
          <div className="expense-breakdown-list">
            {breakdown.map(item => (
              <Link key={item.category} to={`/dashboard/categories/${encodeURIComponent(item.category)}`} className="expense-breakdown-row">
                <div className="expense-breakdown-head">
                  <span>{item.category}</span>
                  <strong>{formatCurrency(item.amount, currencyCode)}</strong>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
