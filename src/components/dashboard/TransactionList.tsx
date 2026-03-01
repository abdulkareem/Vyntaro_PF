import { Link } from 'react-router-dom'
import { TransactionItem } from '../../services/api/dashboardApi'

type TransactionListProps = {
  items: TransactionItem[]
}

function formatAmount(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(Math.abs(value))
}

export default function TransactionList({ items }: TransactionListProps) {
  return (
    <div className="dashboard-card fade-in-up">
      <h3 className="card-heading">Recent Transactions</h3>
      {items.length === 0 ? (
        <p className="dashboard-subtitle">No transactions available yet.</p>
      ) : (
        <div className="transaction-list">
          {items.map(item => (
            <Link to={item.href} key={item.id} className="transaction-row transaction-link">
              <div>
                <div className="transaction-title">{item.title}</div>
                <div className="transaction-date">{item.date}</div>
              </div>
              <div className={item.type === 'income' ? 'amount-income' : 'amount-expense'}>
                {item.amount > 0 ? `+ ${formatAmount(item.amount)}` : `- ${formatAmount(item.amount)}`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
