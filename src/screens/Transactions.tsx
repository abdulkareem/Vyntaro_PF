import { useEffect, useState } from 'react'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import TransactionList from '../components/dashboard/TransactionList'
import { TransactionItem, fetchDashboard } from '../services/api/dashboardApi'

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([])

  useEffect(() => {
    fetchDashboard().then(data => setTransactions(data.transactions))
  }, [])

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Transactions</h2>
      <TransactionList items={transactions} />
    </main>
  )
}
