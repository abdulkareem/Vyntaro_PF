import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import { BudgetItem, fetchDashboard } from '../services/api/dashboardApi'

const entryTypes = [
  { id: 'expense', title: 'Add Expense', subtitle: 'Track daily spending and build better money habits.', icon: '💸' },
  { id: 'income', title: 'Add Income', subtitle: 'Log salary, freelance credits, and cash inflows.', icon: '💰' },
  { id: 'bill', title: 'Add Bill', subtitle: 'Store recurring utilities and invoice records.', icon: '🧾' },
  { id: 'ledger', title: 'Add Ledger Entry', subtitle: 'Track loans, lent amounts, and settlements.', icon: '📒' }
] as const

export default function LedgerEntry() {
  const navigate = useNavigate()
  const [budgets, setBudgets] = useState<BudgetItem[]>([])

  useEffect(() => {
    fetchDashboard().then(data => setBudgets(data.budgets))
  }, [])

  const openEntryForm = (type: string) => {
    navigate(`/dashboard/ledgerentry/new?type=${encodeURIComponent(type)}`)
  }

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Ledger Entry Hub</h2>
      <p className="dashboard-subtitle">Fast, clear, and habit-building entries for every money movement.</p>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Create New Entry</h3>
        <div className="entry-type-grid">
          {entryTypes.map(type => (
            <button key={type.id} type="button" className="entry-type-card" onClick={() => openEntryForm(type.id)}>
              <span className="entry-type-icon">{type.icon}</span>
              <strong>{type.title}</strong>
              <span>{type.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Monthly Category Progress</h3>
        <p className="dashboard-subtitle">Use this to identify overspending early and stay on course.</p>
        <div className="budgets-grid">
          {budgets.map(budget => {
            const usedPercent = Math.min(100, (budget.used / budget.total) * 100)
            return (
              <article key={budget.id} className="budget-card">
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
      </section>
    </main>
  )
}
