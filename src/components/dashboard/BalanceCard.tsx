type BalanceCardProps = {
  balance: number
  income: number
  expense: number
}

export default function BalanceCard({ balance, income, expense }: BalanceCardProps) {
  return (
    <div className="dashboard-card balance-card fade-in-up">
      <p className="balance-label">Current Balance</p>
      <h2 className="balance-value">${balance.toFixed(2)}</h2>

      <div className="balance-metrics">
        <div className="balance-metric income">
          <p>Income</p>
          <strong>${income.toFixed(2)}</strong>
        </div>
        <div className="balance-metric expense">
          <p>Expense</p>
          <strong>${expense.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  )
}
