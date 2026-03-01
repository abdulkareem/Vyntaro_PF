import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency, resolveCurrencyCode } from '../../lib/finance'

function isPrimaryMetric(name: string) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return normalized.includes('charity') || normalized.includes('loan') || normalized.includes('money lent') || normalized === 'lent'
}

export default function BalanceOverview() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const { data, loading, isRefreshing, error, refresh } = useDashboardData(month)
  const currencyCode = useMemo(resolveCurrencyCode, [])

  const metricCards = data?.metricCards ?? []
  const primaryMetricCards = metricCards.filter(card => isPrimaryMetric(card.name))
  const trendPoints = data?.analytics ?? []
  const trendMax = trendPoints.reduce((max, point) => Math.max(max, point.income, point.expense), 1)
  const monthlyBudget = data?.budgetSummary.monthly ?? 0
  const monthlyExpense = data?.expense ?? 0
  const budgetUsagePct = monthlyBudget > 0 ? Math.min((monthlyExpense / monthlyBudget) * 100, 100) : 0

  return (
    <main className="dashboard-page">
      <section className="dashboard-card fade-in-up">
        <div className="section-head-inline">
          <div>
            <h2 className="screen-title">Balance Overview</h2>
            <p className="dashboard-subtitle">Track monthly performance with backend-powered summaries.</p>
            <Link to="/dashboard" className="card-inline-link">← Back to Overview</Link>
          </div>
          <label className="date-switcher">
            <span>Month</span>
            <input
              type="month"
              value={month}
              onChange={event => setMonth(event.target.value)}
              aria-label="Select month"
            />
          </label>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="today-grid budget-grid">
          <article className="today-item budget">
            <span>Current Balance</span>
            <strong>{formatCurrency(data?.balance ?? 0, currencyCode)}</strong>
          </article>
          <Link to="/dashboard/analytics/income" className="today-item income metric-link">
            <span>Total Income</span>
            <strong>{formatCurrency(data?.income ?? 0, currencyCode)}</strong>
          </Link>
          <Link to="/dashboard/analytics/expenses" className="today-item expense metric-link">
            <span>Total Expense</span>
            <strong>{formatCurrency(data?.expense ?? 0, currencyCode)}</strong>
          </Link>
          <Link to="/dashboard/budgets" className="today-item budget metric-link">
            <span>Monthly Budget</span>
            <strong>{formatCurrency(data?.budgetSummary.monthly ?? 0, currencyCode)}</strong>
          </Link>
          {primaryMetricCards.map(card => (
            <Link key={card.id} to={card.href} className="today-item budget metric-link">
              <span>{card.name}</span>
              <strong>{formatCurrency(card.amount ?? 0, currencyCode)}</strong>
            </Link>
          ))}
        </div>

        {(loading || isRefreshing) ? <p className="dashboard-subtitle">Loading monthly summary…</p> : null}
        {!loading && !isRefreshing && (data?.balance ?? 0) === 0 && (data?.income ?? 0) === 0 && (data?.expense ?? 0) === 0 ? (
          <p className="dashboard-subtitle">No financial activity found for this month yet. Start by adding an income or expense entry.</p>
        ) : null}
      </section>

      <section className="dashboard-card fade-in-up">
        <div className="section-head-inline">
          <h3 className="card-heading">All Monthly Metrics</h3>
          <button className="neo-btn neo-btn-link" type="button" onClick={() => void refresh()}>Refresh</button>
        </div>

        <div className="balance-metrics balance-metrics-extended">
          {metricCards.length === 0 ? (
            <p className="dashboard-subtitle">No metric cards available for this month.</p>
          ) : metricCards.map(card => (
            <Link key={card.id} to={card.href} className="balance-metric budget metric-link">
              <p>{card.name}</p>
              <strong>{formatCurrency(card.amount ?? 0, currencyCode)}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <div className="section-head-inline">
          <h3 className="card-heading">Income vs Expense & Budget Graph</h3>
          <div className="shortcut-list">
            <Link className="shortcut-link" to="/dashboard/analytics/income">Income analytics</Link>
            <Link className="shortcut-link" to="/dashboard/analytics/expenses">Expense analytics</Link>
          </div>
        </div>

        {trendPoints.length === 0 ? (
          <p className="dashboard-subtitle">No backend trend points available for this month selection yet.</p>
        ) : (
          <div className="analytics-list">
            {trendPoints.map(point => (
              <div key={point.name} className="analytics-row">
                <span>{point.name}</span>
                <div className="analytics-bars">
                  <div className="analytics-bar income" style={{ width: `${(point.income / trendMax) * 100}%` }} />
                  <div className="analytics-bar expense" style={{ width: `${(point.expense / trendMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="budgets-grid">
          <article>
            <div className="budget-row">
              <span>Budget used (this month)</span>
              <strong>{formatCurrency(monthlyExpense, currencyCode)} / {formatCurrency(monthlyBudget, currencyCode)}</strong>
            </div>
            <div className="budget-track" aria-label="Monthly budget usage graph">
              <div className="budget-fill" style={{ width: `${budgetUsagePct}%` }} />
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-card fade-in-up">
        <h3 className="card-heading">Next actions</h3>
        <div className="shortcut-list">
          <Link to="/dashboard/ledgerentry/new?type=income" className="shortcut-link">Add income entry</Link>
          <Link to="/dashboard/ledgerentry/new?type=expense" className="shortcut-link">Add expense entry</Link>
          <Link to="/dashboard/budgets" className="shortcut-link">Tune budget limits</Link>
        </div>
      </section>
    </main>
  )
}
