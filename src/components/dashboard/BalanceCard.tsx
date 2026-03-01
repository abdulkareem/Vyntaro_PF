import { Link } from 'react-router-dom'
import { DashboardMetricCard } from '../../services/api/dashboardApi'
import { formatCurrency, resolveCurrencyCode } from '../../lib/finance'

type BalanceCardProps = {
  monthLabel: string
  balance: number
  income: number
  expense: number
  metricCards: DashboardMetricCard[]
}

const metricTone = (name: string) => {
  const tone = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  if (['income', 'expense', 'loan', 'charity', 'money-lent'].includes(tone)) return tone
  return 'budget'
}

export default function BalanceCard({
  monthLabel,
  balance,
  income,
  expense,
  metricCards
}: BalanceCardProps) {
  const currencyCode = resolveCurrencyCode()

  return (
    <div className="dashboard-card balance-card fade-in-up">
      <div className="section-head-inline">
        <div>
          <p className="balance-month">{monthLabel}</p>
          <p className="balance-label">Current Balance</p>
        </div>
        <Link to="/dashboard/balance" className="card-inline-link">Balance details →</Link>
      </div>
      <h2 className="balance-value">{formatCurrency(balance, currencyCode)}</h2>

      <div className="balance-metrics balance-metrics-extended">
        <Link to="/dashboard/analytics/income" className="balance-metric income metric-link">
          <p>Income</p>
          <strong>{formatCurrency(income, currencyCode)}</strong>
        </Link>
        <Link to="/dashboard/analytics/expenses" className="balance-metric expense metric-link">
          <p>Expense</p>
          <strong>{formatCurrency(expense, currencyCode)}</strong>
        </Link>
        {metricCards
          .filter(card => !['income', 'expense'].includes(card.name.toLowerCase()))
          .map(card => (
            <Link key={card.id} to={card.href} className={`balance-metric ${metricTone(card.name)} metric-link`}>
              <p>{card.name}</p>
              <strong>{formatCurrency(card.amount, currencyCode)}</strong>
            </Link>
          ))}
      </div>
    </div>
  )
}
