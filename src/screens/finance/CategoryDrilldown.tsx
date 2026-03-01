import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency, resolveCurrencyCode } from '../../lib/finance'

export default function CategoryDrilldown() {
  const { categoryName = '' } = useParams()
  const { data } = useDashboardData()
  const decodedCategory = decodeURIComponent(categoryName)
  const currencyCode = resolveCurrencyCode()

  const matching = useMemo(() => (data?.transactions ?? []).filter(txn => txn.title.toLowerCase().includes(decodedCategory.toLowerCase())), [data?.transactions, decodedCategory])

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">{decodedCategory} Details</h2>
        <p className="dashboard-subtitle">Transaction-level breakdown, trend, and actions for this category.</p>
        <Link to="/dashboard/analytics/expenses" className="card-inline-link">← Back to expense categories</Link>
      </section>
      <section className="dashboard-card fade-in-up">
        {matching.length === 0 ? <p className="dashboard-subtitle">No tagged transactions yet. Add entries with clear naming to improve category mapping.</p> : (
          <div className="activity-list">
            {matching.map(txn => <div key={txn.id} className="activity-link">• {txn.title} ({txn.date}) — {formatCurrency(Math.abs(txn.amount), currencyCode)}</div>)}
          </div>
        )}
      </section>
    </main>
  )
}
