import DashboardTabs from '../components/dashboard/DashboardTabs'
import TransactionList from '../components/dashboard/TransactionList'
import { useDashboardData } from '../hooks/useDashboardData'

export default function Transactions() {
  const { data, loading, error, refresh } = useDashboardData()
  const transactions = data?.transactions ?? []

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Shops & Orders</h2>
      <p className="dashboard-subtitle">Nearby shops, repeat orders, and purchase history.</p>
      {loading && <p className="loading-text">Loading transactions…</p>}
      {!loading && error && (
        <div>
          <p className="error">{error}</p>
          <button className="neo-btn neo-btn-link" type="button" onClick={() => void refresh()}>Retry</button>
        </div>
      )}
      {!loading && !error && <TransactionList items={transactions} />}
    </main>
  )
}
