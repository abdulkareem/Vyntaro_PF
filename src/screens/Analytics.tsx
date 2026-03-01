import DashboardTabs from '../components/dashboard/DashboardTabs'
import { useDashboardData } from '../hooks/useDashboardData'

type Point = { name: string; income: number; expense: number }

export default function Analytics() {
  const { data, loading, error, refresh, retryable } = useDashboardData()
  const points: Point[] = data?.analytics ?? []

  const maxValue = points.reduce((max, item) => Math.max(max, item.income, item.expense), 1)

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Insights</h2>
      <section className="dashboard-card fade-in-up">
        <p className="dashboard-subtitle">Monthly trends and category charts.</p>
        {loading && (
          <div className="skeleton-card">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line-short" />
          </div>
        )}
        {!loading && error && (
          <div>
            <p className="error">{error}</p>
            {retryable ? <button className="neo-btn neo-btn-link" type="button" onClick={() => void refresh()}>Retry</button> : null}
          </div>
        )}
        {!loading && !error && points.length === 0 && <p className="dashboard-subtitle">No analytics data yet.</p>}
        {!loading && !error && points.length > 0 && (
          <div className="analytics-list">
            {points.map(point => (
              <div key={point.name} className="analytics-row">
                <span>{point.name}</span>
                <div className="analytics-bars">
                  <div className="analytics-bar income" style={{ width: `${(point.income / maxValue) * 100}%` }} />
                  <div className="analytics-bar expense" style={{ width: `${(point.expense / maxValue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
