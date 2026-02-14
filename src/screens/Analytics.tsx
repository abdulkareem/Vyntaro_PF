import { useEffect, useState } from 'react'
import { fetchDashboard } from '../services/api/dashboardApi'

type Point = { name: string; income: number; expense: number }

export default function Analytics() {
  const [points, setPoints] = useState<Point[]>([])

  useEffect(() => {
    fetchDashboard().then(data => setPoints(data.analytics))
  }, [])

  const maxValue = points.reduce((max, item) => Math.max(max, item.income, item.expense), 0)

  return (
    <main className="dashboard-page">
      <h2 className="screen-title">Analytics</h2>
      <section className="dashboard-card fade-in-up">
        <p className="dashboard-subtitle">Income vs Expense Trend</p>
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
      </section>
    </main>
  )
}
