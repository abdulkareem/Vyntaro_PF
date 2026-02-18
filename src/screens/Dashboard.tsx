import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BalanceCard from '../components/dashboard/BalanceCard'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import { DashboardData, fetchDashboard } from '../services/api/dashboardApi'

const dateOffsets = ['Yesterday', 'Today', 'Tomorrow']

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [dateOffset, setDateOffset] = useState(1)

  useEffect(() => {
    fetchDashboard().then(setData)
  }, [])

  if (!data) return <main className="dashboard-page"><p className="loading-text">Loading dashboard…</p></main>

  const today = data.todaySummary
  const dateLabel = dateOffsets[dateOffset] || today.dateLabel

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <DashboardHeader userName={data.userName} profilePhoto={data.profilePhoto} />
      <BalanceCard
        monthLabel={data.monthLabel}
        balance={data.balance}
        income={data.income}
        expense={data.expense}
        moneyLent={data.moneyLent}
        loan={data.loan}
        charity={data.charity}
      />

      <section className="dashboard-card fade-in-up">
        <div className="bills-head">
          <h3 className="card-heading">Today's Snapshot</h3>
          <div className="date-switcher" aria-label="Move date">
            <button
              type="button"
              className="date-arrow"
              onClick={() => setDateOffset(v => Math.max(0, v - 1))}
              aria-label="Previous day"
            >
              ←
            </button>
            <span>{dateLabel}</span>
            <button
              type="button"
              className="date-arrow"
              onClick={() => setDateOffset(v => Math.min(2, v + 1))}
              aria-label="Next day"
            >
              →
            </button>
          </div>
        </div>
        <div className="today-grid">
          <article className="today-item income"><span>Income</span><strong>${today.income.toFixed(2)}</strong></article>
          <article className="today-item expense"><span>Expense</span><strong>${today.expense.toFixed(2)}</strong></article>
          <article className="today-item lent"><span>Money Lent</span><strong>${today.moneyLent.toFixed(2)}</strong></article>
          <article className="today-item loan"><span>Loan</span><strong>${today.loan.toFixed(2)}</strong></article>
          <article className="today-item charity"><span>Charity</span><strong>${today.charity.toFixed(2)}</strong></article>
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Budget Overview</h3>
        <div className="today-grid budget-grid">
          <article className="today-item budget"><span>Monthly Budget</span><strong>${data.budgetSummary.monthly.toFixed(2)}</strong></article>
          <article className="today-item budget"><span>Yearly Budget</span><strong>${data.budgetSummary.yearly.toFixed(2)}</strong></article>
        </div>
      </section>

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
