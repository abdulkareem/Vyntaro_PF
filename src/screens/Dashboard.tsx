import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import BalanceCard from '../components/dashboard/BalanceCard'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import { DashboardData, ExpenseBreakdownItem, fetchDashboard, SmartAlert } from '../services/api/dashboardApi'

const dateOffsets = ['Yesterday', 'Today', 'Tomorrow']

function resolveCurrencyCode() {
  const locale = navigator.language.toLowerCase()
  return locale.includes('in') ? 'INR' : 'USD'
}

function formatCurrency(value: number, currencyCode: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2
  }).format(value)
}

function scoreTone(label: DashboardData['insights']['financialHealth']['label']) {
  if (label === 'Good') return 'health-good'
  if (label === 'Average') return 'health-average'
  return 'health-risky'
}

function alertTone(type: SmartAlert['type']) {
  if (type === 'warning') return 'alert-warning'
  if (type === 'success') return 'alert-success'
  return 'alert-info'
}

function largestBreakdownAmount(items: ExpenseBreakdownItem[]) {
  return items.reduce((max, item) => Math.max(max, item.amount), 0)
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [dateOffset, setDateOffset] = useState(1)
  const currencyCode = useMemo(resolveCurrencyCode, [])

  useEffect(() => {
    fetchDashboard().then(setData)
  }, [])

  if (!data) return <main className="dashboard-page"><p className="loading-text">Loading dashboard…</p></main>

  const today = data.todaySummary
  const dateLabel = dateOffsets[dateOffset] || today.dateLabel
  const maxExpenseCategory = largestBreakdownAmount(data.insights.expenseBreakdown)

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <DashboardHeader userName={data.userName} profilePhoto={data.profilePhoto} />
      <BalanceCard
        monthLabel={data.monthLabel}
        balance={data.balance}
        income={data.income}
        expense={data.expense}
        metricCards={data.metricCards}
      />

      <section className="dashboard-card fade-in-up">
        <div className="financial-health-head">
          <h3 className="card-heading">Financial Health Score</h3>
          <span className={`health-badge ${scoreTone(data.insights.financialHealth.label)}`}>{data.insights.financialHealth.label}</span>
        </div>
        <div className="financial-health-content">
          <strong className="health-score">{data.insights.financialHealth.score}/100</strong>
          <p className="dashboard-subtitle">Composed from expense ratio, savings rate, debt/lending exposure, and budget utilization.</p>
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Net Worth & Savings</h3>
        <div className="today-grid budget-grid">
          <article className="today-item budget"><span>Net Worth</span><strong>{formatCurrency(data.insights.netWorth.netWorth, currencyCode)}</strong></article>
          <article className="today-item budget"><span>Savings (This Month)</span><strong>{formatCurrency(data.insights.netWorth.savingsThisMonth, currencyCode)}</strong></article>
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Expense Breakdown</h3>
        {data.insights.expenseBreakdown.length === 0 ? (
          <p className="dashboard-subtitle">No expense categories found for this month.</p>
        ) : (
          <div className="expense-breakdown-list">
            {data.insights.expenseBreakdown.map(item => (
              <article key={item.category} className="expense-breakdown-row">
                <div className="expense-breakdown-head">
                  <span>{item.category}</span>
                  <strong>{formatCurrency(item.amount, currencyCode)}</strong>
                </div>
                <div className="expense-breakdown-track">
                  <div
                    className="expense-breakdown-fill"
                    style={{ width: `${maxExpenseCategory > 0 ? (item.amount / maxExpenseCategory) * 100 : 0}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Smart Alerts</h3>
        {data.insights.alerts.length === 0 ? (
          <p className="dashboard-subtitle">No alerts right now. Keep up the good momentum.</p>
        ) : (
          <div className="alerts-list">
            {data.insights.alerts.slice(0, 3).map((alert, index) => (
              <article key={`${alert.type}-${index}`} className={`alert-item ${alertTone(alert.type)}`}>
                <strong>{alert.type.toUpperCase()}</strong>
                <p>{alert.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Predictive Monthly Balance</h3>
        <p className="dashboard-subtitle">At current pace, your projected end-of-month balance is:</p>
        <p className="prediction-value">{formatCurrency(data.insights.prediction.projectedBalance, currencyCode)}</p>
      </section>

      <section className="dashboard-card fade-in-up">
        <details className="lending-details">
          <summary className="lending-summary-head">
            <h3 className="card-heading">Money Lent / Loan Intelligence</h3>
            <span>Expand</span>
          </summary>

          <div className="today-grid budget-grid lending-totals">
            <article className="today-item lent"><span>Total Lent</span><strong>{formatCurrency(data.insights.lendingSummary.totalLent, currencyCode)}</strong></article>
            <article className="today-item loan"><span>Total Loan</span><strong>{formatCurrency(data.insights.lendingSummary.totalLoan, currencyCode)}</strong></article>
          </div>

          <div className="lending-breakdown">
            {data.insights.lendingSummary.breakdown.length === 0 ? (
              <p className="dashboard-subtitle">No lending or loan records found.</p>
            ) : (
              data.insights.lendingSummary.breakdown.map((item, index) => (
                <article key={`${item.person}-${index}`} className="lending-person-row">
                  <div>
                    <strong>{item.person}</strong>
                    <p className="dashboard-subtitle">{item.kind === 'lent' ? 'Money Lent' : 'Loan'}{item.dueDate ? ` • Due ${item.dueDate}` : ''}</p>
                  </div>
                  <div className="lending-amount-wrap">
                    <strong>{formatCurrency(item.amount, currencyCode)}</strong>
                    {item.overdue ? <span className="overdue-pill">Overdue</span> : null}
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="aging-buckets">
            {data.insights.lendingSummary.agingBuckets.map(bucket => (
              <article key={bucket.bucket} className="aging-bucket">
                <strong>{bucket.bucket} Days</strong>
                <span>{bucket.count} entries</span>
                <span>{formatCurrency(bucket.amount, currencyCode)}</span>
              </article>
            ))}
          </div>
        </details>
      </section>

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
          {today.cardTotals
            .filter(card => !['income', 'expense'].includes(card.name.toLowerCase()))
            .map(card => (
              <article key={card.id} className="today-item budget">
                <span>{card.name}</span><strong>${card.amount.toFixed(2)}</strong>
              </article>
            ))}
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
