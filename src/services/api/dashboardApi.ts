export type TransactionItem = {
  id: string
  title: string
  amount: number
  type: 'income' | 'expense'
  date: string
}

export type BudgetItem = {
  id: string
  name: string
  used: number
  total: number
}

export type DashboardData = {
  userName: string
  balance: number
  income: number
  expense: number
  transactions: TransactionItem[]
  budgets: BudgetItem[]
  analytics: Array<{ name: string; income: number; expense: number }>
}

const mockData: DashboardData = {
  userName: 'John Doe',
  balance: 12500.75,
  income: 8500,
  expense: 3450,
  transactions: [
    { id: '1', title: 'Salary', amount: 5000, type: 'income', date: '2026-01-28' },
    { id: '2', title: 'Groceries', amount: -210, type: 'expense', date: '2026-01-27' },
    { id: '3', title: 'Electricity Bill', amount: -120, type: 'expense', date: '2026-01-26' },
    { id: '4', title: 'Freelance Payment', amount: 1100, type: 'income', date: '2026-01-25' }
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

export async function fetchDashboard(): Promise<DashboardData> {
  await new Promise(resolve => setTimeout(resolve, 250))
  return mockData
}
