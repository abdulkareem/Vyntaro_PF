import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency, resolveCurrencyCode } from '../../lib/finance'

export default function IncomeAnalytics() {
  const { data } = useDashboardData()
  const currencyCode = resolveCurrencyCode()
  const incomeTransactions = (data?.transactions ?? []).filter(item => item.type === 'income')

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">Income Analytics</h2>
        <p className="dashboard-subtitle">Identify your strongest inflow sources and consistency over time.</p>
        <p className="prediction-value">{formatCurrency(data?.income ?? 0, currencyCode)}</p>
      </section>
      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Recent Income Credits</h3>
        {incomeTransactions.length === 0 ? <p className="dashboard-subtitle">No income recorded yet. Add your first salary/freelance credit.</p> : (
          <div className="activity-list">
            {incomeTransactions.map(item => <div key={item.id} className="activity-link">• {item.title} — {formatCurrency(Math.abs(item.amount), currencyCode)}</div>)}
          </div>
        )}
      </section>
    </main>
  )
}
