import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'

export default function AlertsCenter() {
  const { data } = useDashboardData()
  const alerts = data?.insights.alerts ?? []

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">Smart Alerts Center</h2>
        {alerts.length === 0 ? <p className="dashboard-subtitle">No active alerts. You're in a stable financial zone.</p> : (
          <div className="alerts-list">
            {alerts.map((alert, idx) => <article key={`${alert.type}-${idx}`} className={`alert-item alert-${alert.type}`}><strong>{alert.type.toUpperCase()}</strong><p>{alert.message}</p></article>)}
          </div>
        )}
      </section>
    </main>
  )
}
