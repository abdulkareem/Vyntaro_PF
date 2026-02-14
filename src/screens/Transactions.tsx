import { useEffect, useState } from 'react'
import TransactionList from '../components/dashboard/TransactionList'
import { TransactionItem, fetchDashboard } from '../services/api/dashboardApi'

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([])

  useEffect(() => {
    fetchDashboard().then(data => setTransactions(data.transactions))
  }, [])

  return (
    <main className="dashboard-page">
      <h2 className="screen-title">Transactions</h2>
      <TransactionList items={transactions} />
    </main>
  )
}
