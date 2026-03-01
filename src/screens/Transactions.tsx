import { Link } from 'react-router-dom'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import TransactionList from '../components/dashboard/TransactionList'
import { useDashboardData } from '../hooks/useDashboardData'

export default function Transactions() {
  const { data, loading, error, refresh, retryable } = useDashboardData()
  const transactions = data?.transactions ?? []

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Transactions</h2>
      <p className="dashboard-subtitle">Track and filter all money movement in one place.</p>

      <section className="dashboard-card fade-in-up">
        <div className="bills-head">
          <h3 className="card-heading">Actions</h3>
          <Link to="/dashboard/ledgerentry/new?type=expense" className="neo-btn neo-btn-primary">Add Transaction</Link>
        </div>
      </section>

      {loading && (
        <section className="dashboard-card fade-in-up skeleton-card">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line-short" />
        </section>
      )}

      {!loading && error && (
        <section className="dashboard-card fade-in-up">
          <p className="error">{error}</p>
          {retryable ? <button className="neo-btn neo-btn-link" type="button" onClick={() => void refresh()}>Retry</button> : null}
        </section>
      )}

      {!loading && !error && <TransactionList items={transactions} />}
    </main>
  )
}
