import { useEffect, useState } from 'react'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import { BudgetItem, fetchDashboard } from '../services/api/dashboardApi'

export default function Budgets() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([])

  useEffect(() => {
    fetchDashboard().then(data => setBudgets(data.budgets))
  }, [])

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Add & Transport</h2>
      <p className="dashboard-subtitle">Quick expense entry and trusted auto/car actions.</p>
      <div className="budgets-grid">
        {budgets.map(budget => {
          const usedPercent = Math.min(100, (budget.used / budget.total) * 100)
          return (
            <article key={budget.id} className="dashboard-card fade-in-up">
              <div className="budget-row">
                <strong>{budget.name}</strong>
                <span>₹{budget.used} / ₹{budget.total}</span>
              </div>
              <div className="budget-track">
                <div className="budget-fill" style={{ width: `${usedPercent}%` }} />
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
