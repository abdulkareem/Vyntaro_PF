import { Link } from 'react-router-dom'

type BalanceCardProps = {
  monthLabel: string
  balance: number
  income: number
  expense: number
  moneyLent: number
  loan: number
  charity: number
}

const formatMoney = (value: number) => `$${value.toFixed(2)}`

export default function BalanceCard({
  monthLabel,
  balance,
  income,
  expense,
  moneyLent,
  loan,
  charity
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
        <Link to="/dashboard/transactions?type=money-lent" className="balance-metric lent metric-link">
          <p>Money Lent</p>
          <strong>{formatMoney(moneyLent)}</strong>
        </Link>
        <Link to="/dashboard/transactions?type=loan" className="balance-metric loan metric-link">
          <p>Loan</p>
          <strong>{formatMoney(loan)}</strong>
        </Link>
        <Link to="/dashboard/transactions?type=charity" className="balance-metric charity metric-link">
          <p>Charity</p>
          <strong>{formatMoney(charity)}</strong>
        </Link>
      </div>
    </div>
  )
}
