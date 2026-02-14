import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BalanceCard from '../components/dashboard/BalanceCard'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardTabs from '../components/dashboard/DashboardTabs'
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

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Quick Actions</h3>
        <div className="job-grid">
          {data.jobs.map(job => (
            <Link key={job.id} to={job.href} className="job-card">
              <span className="job-icon">{job.icon}</span>
              <span>{job.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Smart Shortcuts</h3>
        <div className="shortcut-list">
          {data.shortcuts.map(item => (
            <Link key={item.id} to={item.href} className="shortcut-link">{item.text}</Link>
          ))}
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Recent Activity</h3>
        <div className="activity-list">
          {data.activity.map(item => (
            <Link key={item.id} to={item.href} className="activity-link">• {item.text}</Link>
          ))}
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <div className="bills-head">
          <h3 className="card-heading">Bills & Records</h3>
          <Link to="/dashboard/transactions?view=all-bills" className="bills-all-link">All Bills →</Link>
        </div>
        <div className="bill-list">
          {data.bills.map(bill => (
            <Link key={bill.id} to={bill.href} className="bill-row">
              <span>{bill.shop}</span>
              <strong>₹{bill.amount}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
