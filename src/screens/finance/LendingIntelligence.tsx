import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency, resolveCurrencyCode } from '../../lib/finance'

export default function LendingIntelligence() {
  const { data } = useDashboardData()
  const summary = data?.insights.lendingSummary
  const currencyCode = resolveCurrencyCode()

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">Lending Intelligence</h2>
        <p className="dashboard-subtitle">Monitor money lent, liabilities, and overdue risk by counterparty.</p>
        <div className="today-grid budget-grid lending-totals">
          <article className="today-item lent"><span>Total Lent</span><strong>{formatCurrency(summary?.totalLent ?? 0, currencyCode)}</strong></article>
          <article className="today-item loan"><span>Total Loan</span><strong>{formatCurrency(summary?.totalLoan ?? 0, currencyCode)}</strong></article>
        </div>
      </section>
    </main>
  )
}
