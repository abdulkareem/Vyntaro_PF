import { Link } from 'react-router-dom'
import DashboardTabs from '../../components/dashboard/DashboardTabs'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency, resolveCurrencyCode } from '../../lib/finance'

export default function BalanceOverview() {
  const { data, loading } = useDashboardData()
  const currencyCode = resolveCurrencyCode()
  const dashboard = data

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <h2 className="screen-title">Balance Overview</h2>
        <p className="dashboard-subtitle">A single place to monitor current balance, inflow vs outflow, and budget posture.</p>
        {loading ? <div className="skeleton-line" /> : (
          <div className="today-grid budget-grid">
            <article className="today-item budget"><span>Current Balance</span><strong>{formatCurrency(dashboard?.balance ?? 0, currencyCode)}</strong></article>
            <article className="today-item income"><span>Total Income</span><strong>{formatCurrency(dashboard?.income ?? 0, currencyCode)}</strong></article>
            <article className="today-item expense"><span>Total Expense</span><strong>{formatCurrency(dashboard?.expense ?? 0, currencyCode)}</strong></article>
            <article className="today-item budget"><span>Monthly Budget</span><strong>{formatCurrency(dashboard?.budgetSummary.monthly ?? 0, currencyCode)}</strong></article>
          </div>
        )}
      </section>
      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Next actions</h3>
        <div className="shortcut-list">
          <Link to="/dashboard/ledgerentry/new?type=income" className="shortcut-link">Add income entry</Link>
          <Link to="/dashboard/ledgerentry/new?type=expense" className="shortcut-link">Add expense entry</Link>
          <Link to="/dashboard/budgets" className="shortcut-link">Tune budget limits</Link>
        </div>
      </section>
    </main>
  )
}
