import { currentUser } from '../auth'

export type TransactionItem = {
  id: string
  title: string
  amount: number
  type: 'income' | 'expense'
  date: string
  href: string
}

export type BudgetItem = {
  id: string
  name: string
  used: number
  total: number
}

export type DashboardData = {
  userName: string
  profilePhoto: string
  monthLabel: string
  balance: number
  income: number
  expense: number
  transactions: TransactionItem[]
  budgets: BudgetItem[]
  analytics: Array<{ name: string; income: number; expense: number }>
}

function fallbackAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`
}

export async function fetchDashboard(): Promise<DashboardData> {
  const user = currentUser()
  const displayName = user?.name || 'John Doe'

  await new Promise(resolve => setTimeout(resolve, 200))

  return {
    userName: displayName,
    profilePhoto: user?.avatarUrl || fallbackAvatar(displayName),
    monthLabel: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    balance: 12500.75,
    income: 8500,
    expense: 3450,
    transactions: [
      { id: '1', title: 'Salary', amount: 5000, type: 'income', date: '2026-01-28', href: '/dashboard/transactions?txn=1' },
      { id: '2', title: 'Groceries', amount: -210, type: 'expense', date: '2026-01-27', href: '/dashboard/transactions?txn=2' },
      { id: '3', title: 'Electricity Bill', amount: -120, type: 'expense', date: '2026-01-26', href: '/dashboard/transactions?txn=3' },
      { id: '4', title: 'Freelance Payment', amount: 1100, type: 'income', date: '2026-01-25', href: '/dashboard/transactions?txn=4' }
    ],
    budgets: [
      { id: 'b1', name: 'Food', used: 120, total: 300 },
      { id: 'b2', name: 'Travel', used: 450, total: 800 },
      { id: 'b3', name: 'Shopping', used: 200, total: 500 }
    ],
    analytics: [
      { name: 'Jan', income: 4000, expense: 2400 },
      { name: 'Feb', income: 3000, expense: 1398 },
      { name: 'Mar', income: 5000, expense: 2800 },
      { name: 'Apr', income: 4780, expense: 3908 }
    ]
  }
}
