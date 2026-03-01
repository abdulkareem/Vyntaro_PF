import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'

export default function FinancialHealthDetails() {
  const { data } = useDashboardData()
  const health = data?.insights.financialHealth

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">Financial Health Score</h2>
        <p className="prediction-value">{health?.score ?? 0}/100</p>
        <p className="dashboard-subtitle">Score label: {health?.label ?? 'Average'}. Computed from expense ratio, savings rate, and exposure metrics.</p>
      </section>
    </main>
  )
}
