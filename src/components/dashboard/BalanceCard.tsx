import { Link } from 'react-router-dom'
import { DashboardMetricCard } from '../../services/api/dashboardApi'

type BalanceCardProps = {
  monthLabel: string
  balance: number
  income: number
  expense: number
  metricCards: DashboardMetricCard[]
}

const formatMoney = (value: number) => `$${value.toFixed(2)}`

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
  return (
    <div className="dashboard-card balance-card fade-in-up">
      <p className="balance-month">{monthLabel}</p>
      <p className="balance-label">Current Balance</p>
      <h2 className="balance-value">{formatMoney(balance)}</h2>

      <div className="balance-metrics balance-metrics-extended">
        <Link to="/dashboard/analytics" className="balance-metric income metric-link">
          <p>Income</p>
          <strong>{formatMoney(income)}</strong>
        </Link>
        <Link to="/dashboard/analytics" className="balance-metric expense metric-link">
          <p>Expense</p>
          <strong>{formatMoney(expense)}</strong>
        </Link>
        {metricCards
          .filter(card => !['income', 'expense'].includes(card.name.toLowerCase()))
          .map(card => (
            <Link key={card.id} to={card.href} className={`balance-metric ${metricTone(card.name)} metric-link`}>
              <p>{card.name}</p>
              <strong>{formatMoney(card.amount)}</strong>
            </Link>
          ))}
      </div>
    </div>
  )
}
