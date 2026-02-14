import { useEffect, useState } from 'react'
import BalanceCard from '../components/dashboard/BalanceCard'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import QuickActions from '../components/dashboard/QuickActions'
import TransactionList from '../components/dashboard/TransactionList'
import { DashboardData, fetchDashboard } from '../services/api/dashboardApi'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetchDashboard().then(setData)
  }, [])

  if (!data) return <main className="dashboard-page"><p className="loading-text">Loading dashboard…</p></main>

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <DashboardHeader userName={data.userName} profilePhoto={data.profilePhoto} />
      <BalanceCard monthLabel={data.monthLabel} balance={data.balance} income={data.income} expense={data.expense} />
      <QuickActions />
      <TransactionList items={data.transactions.slice(0, 3)} />
    </main>
  )
}
