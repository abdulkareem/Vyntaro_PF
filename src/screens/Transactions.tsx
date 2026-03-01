import { useEffect, useState } from 'react'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import TransactionList from '../components/dashboard/TransactionList'
import { TransactionItem, fetchDashboard } from '../services/api/dashboardApi'

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
      .then(data => setTransactions(data.transactions))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to load transactions.')
      })
  }, [])

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Shops & Orders</h2>
      <p className="dashboard-subtitle">Nearby shops, repeat orders, and purchase history.</p>
      {error ? <p className="error">{error}</p> : <TransactionList items={transactions} />}
    </main>
  )
}
