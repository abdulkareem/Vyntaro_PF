import { useEffect, useState } from 'react'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import { BudgetItem, fetchDashboard } from '../services/api/dashboardApi'

const entryTypes = [
  { id: 'expense', title: 'Add Expense', subtitle: 'Track payments, card swipes, and cash spends.', icon: '💸' },
  { id: 'income', title: 'Add Income', subtitle: 'Salary, side hustle, and transfer credits.', icon: '💰' },
  { id: 'bill', title: 'Add Bill', subtitle: 'Store recurring utilities and invoice records.', icon: '🧾' },
  { id: 'ledger', title: 'Add Ledger Entry', subtitle: 'Record loans, money lent, and settlements.', icon: '📒' }
]

export default function Budgets() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([])

  useEffect(() => {
    fetchDashboard().then(data => setBudgets(data.budgets))
  }, [])

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Smart Add Center</h2>
      <p className="dashboard-subtitle">Create expense, income, bill, and ledger entries in one ultra-modern flow.</p>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Create New Entry</h3>
        <div className="entry-type-grid">
          {entryTypes.map(type => (
            <button key={type.id} type="button" className="entry-type-card">
              <span className="entry-type-icon">{type.icon}</span>
              <strong>{type.title}</strong>
              <span>{type.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

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
