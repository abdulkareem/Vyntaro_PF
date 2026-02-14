import { TransactionItem } from '../../services/api/dashboardApi'

type TransactionListProps = {
  items: TransactionItem[]
}

export default function TransactionList({ items }: TransactionListProps) {
  return (
    <div className="dashboard-card fade-in-up">
      <h3 className="card-heading">Recent Transactions</h3>
      <div className="transaction-list">
        {items.map(item => (
          <div key={item.id} className="transaction-row">
            <div>
              <div className="transaction-title">{item.title}</div>
              <div className="transaction-date">{item.date}</div>
            </div>
            <div className={item.type === 'income' ? 'amount-income' : 'amount-expense'}>
              {item.amount > 0 ? `+ $${item.amount}` : `- $${Math.abs(item.amount)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
