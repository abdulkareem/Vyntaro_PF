import { Link } from 'react-router-dom'

type BalanceCardProps = {
  monthLabel: string
  balance: number
  income: number
  expense: number
}

export default function BalanceCard({ monthLabel, balance, income, expense }: BalanceCardProps) {
  return (
    <div className="dashboard-card balance-card fade-in-up">
      <p className="balance-month">{monthLabel}</p>
      <p className="balance-label">Current Balance</p>
      <h2 className="balance-value">${balance.toFixed(2)}</h2>

      <div className="balance-metrics">
        <Link to="/dashboard/analytics" className="balance-metric income metric-link">
          <p>Income</p>
          <strong>${income.toFixed(2)}</strong>
        </Link>
        <Link to="/dashboard/analytics" className="balance-metric expense metric-link">
          <p>Expense</p>
          <strong>${expense.toFixed(2)}</strong>
        </Link>
      </div>
    </div>
  )
}
