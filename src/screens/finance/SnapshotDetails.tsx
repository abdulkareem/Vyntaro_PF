import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency, resolveCurrencyCode } from '../../lib/finance'

export default function SnapshotDetails() {
  const { data } = useDashboardData()
  const currencyCode = resolveCurrencyCode()
  const today = data?.todaySummary

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">Daily Snapshot</h2>
        <p className="dashboard-subtitle">Intra-day view of inflows, outflows, and category movement.</p>
        <div className="today-grid">
          <article className="today-item income"><span>Income</span><strong>{formatCurrency(today?.income ?? 0, currencyCode)}</strong></article>
          <article className="today-item expense"><span>Expense</span><strong>{formatCurrency(today?.expense ?? 0, currencyCode)}</strong></article>
        </div>
      </section>
    </main>
  )
}
