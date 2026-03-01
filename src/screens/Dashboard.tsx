import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import BalanceCard from '../components/dashboard/BalanceCard'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import TransactionList from '../components/dashboard/TransactionList'
import { DashboardData, ExpenseBreakdownItem, SmartAlert } from '../services/api/dashboardApi'
import { useDashboardData } from '../hooks/useDashboardData'

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

function buildZeroStateDashboard(): DashboardData {
  return {
    userName: 'User',
    profilePhoto: '',
    monthLabel: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    balance: 0,
    income: 0,
    expense: 0,
    metricCards: [],
    todaySummary: {
      dateLabel: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      income: 0,
      expense: 0,
      cardTotals: []
    },
    budgetSummary: {
      monthly: 0,
      yearly: 0
    },
    jobs: [],
    shortcuts: [],
    activity: [],
    bills: [],
    transactions: [],
    budgets: [],
    analytics: [],
    insights: {
      financialHealth: { score: 0, label: 'Average' },
      netWorth: { netWorth: 0, savingsThisMonth: 0 },
      expenseBreakdown: [],
      alerts: [],
      prediction: { projectedBalance: 0 },
      lendingSummary: {
        totalLent: 0,
        totalLoan: 0,
        breakdown: [],
        agingBuckets: [
          { bucket: '0-30', count: 0, amount: 0 },
          { bucket: '31-60', count: 0, amount: 0 },
          { bucket: '61-90', count: 0, amount: 0 },
          { bucket: '90+', count: 0, amount: 0 }
        ]
      }
    },
    ledgerCategoriesState: {
      message: null,
      retryable: false
    }
  }
}

export default function Dashboard() {
  const { data, loading, error, errorCode, refresh, retryable, isRefreshing } = useDashboardData()
  const [dateOffset, setDateOffset] = useState(1)
  const currencyCode = useMemo(resolveCurrencyCode, [])

  if (loading) {
    return (
      <main className="dashboard-page" aria-busy="true" aria-live="polite">
        <DashboardTabs />
        <section className="dashboard-card fade-in-up skeleton-card">
          <div className="skeleton-line skeleton-line-lg" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line-short" />
        </section>
        <section className="dashboard-card fade-in-up skeleton-card">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line-short" />
        </section>
        <section className="dashboard-card fade-in-up skeleton-card">
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line-short" />
        </section>
      </main>
    )
  }

  const dashboard = data ?? buildZeroStateDashboard()

  const today = dashboard.todaySummary
  const dateLabel = dateOffsets[dateOffset] || today.dateLabel
  const maxExpenseCategory = largestBreakdownAmount(dashboard.insights.expenseBreakdown)

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      {error ? (
        <section className="dashboard-card fade-in-up">
          <p className="error">{error}</p>
          {errorCode === 403 ? <p className="dashboard-subtitle">Contact your administrator if this seems unexpected.</p> : null}
          {retryable ? (
            <button className="neo-btn neo-btn-link" type="button" onClick={() => void refresh()}>Retry dashboard load</button>
          ) : null}
        </section>
      ) : null}
      {isRefreshing ? <p className="dashboard-subtitle">Refreshing dashboard data…</p> : null}
      <DashboardHeader userName={dashboard.userName} profilePhoto={dashboard.profilePhoto} />
      <BalanceCard
        monthLabel={dashboard.monthLabel}
        balance={dashboard.balance}
        income={dashboard.income}
        expense={dashboard.expense}
        metricCards={dashboard.metricCards}
      />

      <section className="dashboard-card fade-in-up">
        <div className="financial-health-head">
          <h3 className="card-heading">Financial Health Score</h3>
          <span className={`health-badge ${scoreTone(dashboard.insights.financialHealth.label)}`}>{dashboard.insights.financialHealth.label}</span>
        </div>
        <div className="financial-health-content">
          <strong className="health-score">{dashboard.insights.financialHealth.score}/100</strong>
          <p className="dashboard-subtitle">Composed from expense ratio, savings rate, debt/lending exposure, and budget utilization.</p>
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Net Worth & Savings</h3>
        <div className="today-grid budget-grid">
          <article className="today-item budget"><span>Net Worth</span><strong>{formatCurrency(dashboard.insights.netWorth.netWorth, currencyCode)}</strong></article>
          <article className="today-item budget"><span>Savings (This Month)</span><strong>{formatCurrency(dashboard.insights.netWorth.savingsThisMonth, currencyCode)}</strong></article>
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Expense Breakdown</h3>
        {dashboard.ledgerCategoriesState.message ? (
          <div>
            <p className="dashboard-subtitle">{dashboard.ledgerCategoriesState.message}</p>
            {dashboard.ledgerCategoriesState.retryable ? (
              <button className="neo-btn neo-btn-link" type="button" onClick={() => void refresh()}>Retry categories</button>
            ) : null}
          </div>
        ) : null}
        {dashboard.insights.expenseBreakdown.length === 0 ? (
          <p className="dashboard-subtitle">No categories yet.</p>
        ) : (
          <div className="expense-breakdown-list">
            {dashboard.insights.expenseBreakdown.map(item => (
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
        {dashboard.insights.alerts.length === 0 ? (
          <p className="dashboard-subtitle">No alerts right now. Keep up the good momentum.</p>
        ) : (
          <div className="alerts-list">
            {dashboard.insights.alerts.slice(0, 3).map((alert, index) => (
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
        <p className="prediction-value">{formatCurrency(dashboard.insights.prediction.projectedBalance, currencyCode)}</p>
      </section>

      <section className="dashboard-card fade-in-up">
        <details className="lending-details">
          <summary className="lending-summary-head">
            <h3 className="card-heading">Money Lent / Loan Intelligence</h3>
            <span>Expand</span>
          </summary>

          <div className="today-grid budget-grid lending-totals">
            <article className="today-item lent"><span>Total Lent</span><strong>{formatCurrency(dashboard.insights.lendingSummary.totalLent, currencyCode)}</strong></article>
            <article className="today-item loan"><span>Total Loan</span><strong>{formatCurrency(dashboard.insights.lendingSummary.totalLoan, currencyCode)}</strong></article>
          </div>

          <div className="lending-breakdown">
            {dashboard.insights.lendingSummary.breakdown.length === 0 ? (
              <p className="dashboard-subtitle">No lending or loan records found.</p>
            ) : (
              dashboard.insights.lendingSummary.breakdown.map((item, index) => (
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
            {dashboard.insights.lendingSummary.agingBuckets.map(bucket => (
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
              disabled={dateOffset === 0}
            >
              ←
            </button>
            <span>{dateLabel}</span>
            <button
              type="button"
              className="date-arrow"
              onClick={() => setDateOffset(v => Math.min(2, v + 1))}
              aria-label="Next day"
              disabled={dateOffset === 2}
            >
              →
            </button>
          </div>
        </div>
        <div className="today-grid">
          <article className="today-item income"><span>Income</span><strong>{formatCurrency(today.income, currencyCode)}</strong></article>
          <article className="today-item expense"><span>Expense</span><strong>{formatCurrency(today.expense, currencyCode)}</strong></article>
          {today.cardTotals
            .filter(card => !['income', 'expense'].includes(card.name.toLowerCase()))
            .map(card => (
              <article key={card.id} className="today-item budget">
                <span>{card.name}</span><strong>{formatCurrency(card.amount, currencyCode)}</strong>
              </article>
            ))}
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Budget Overview</h3>
        <div className="today-grid budget-grid">
          <article className="today-item budget"><span>Monthly Budget</span><strong>{formatCurrency(dashboard.budgetSummary.monthly, currencyCode)}</strong></article>
          <article className="today-item budget"><span>Yearly Budget</span><strong>{formatCurrency(dashboard.budgetSummary.yearly, currencyCode)}</strong></article>
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <div className="bills-head">
          <h3 className="card-heading">Quick Actions</h3>
          <button className="neo-btn neo-btn-link" type="button" onClick={() => void refresh()}>Refresh</button>
        </div>
        <div className="job-grid">
          {dashboard.jobs.map(job => (
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
          {dashboard.shortcuts.map(item => (
            <Link key={item.id} to={item.href} className="shortcut-link">{item.text}</Link>
          ))}
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Recent Activity</h3>
        <div className="activity-list">
          {dashboard.activity.map(item => (
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
          {dashboard.bills.length === 0 ? (
            <p className="dashboard-subtitle">No bill records yet.</p>
          ) : (
            dashboard.bills.map(bill => (
              <Link key={bill.id} to={bill.href} className="bill-row">
                <span>{bill.shop}</span>
                <strong>{formatCurrency(bill.amount, currencyCode)}</strong>
              </Link>
            ))
          )}
        </div>
      </section>

      <TransactionList items={dashboard.transactions} />
    </main>
  )
}
