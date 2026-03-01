import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency, resolveCurrencyCode } from '../../lib/finance'

export default function PredictionDetails() {
  const { data } = useDashboardData()
  const currencyCode = resolveCurrencyCode()

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">Projected Balance</h2>
        <p className="dashboard-subtitle">End-of-month projection from current income/expense trendline.</p>
        <p className="prediction-value">{formatCurrency(data?.insights.prediction.projectedBalance ?? 0, currencyCode)}</p>
      </section>
    </main>
  )
}
