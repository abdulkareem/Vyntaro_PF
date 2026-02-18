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

export type QuickJob = {
  id: string
  label: string
  icon: string
  href: string
}

export type SmartShortcut = {
  id: string
  text: string
  href: string
}

export type ActivityItem = {
  id: string
  text: string
  href: string
}

export type BillItem = {
  id: string
  shop: string
  amount: number
  date: string
  href: string
}

export type DashboardData = {
  userName: string
  profilePhoto: string
  monthLabel: string
  balance: number
  income: number
  expense: number
  moneyLent: number
  loan: number
  charity: number
  todaySummary: {
    dateLabel: string
    income: number
    expense: number
    moneyLent: number
    loan: number
    charity: number
  }
  budgetSummary: {
    monthly: number
    yearly: number
  }
  jobs: QuickJob[]
  shortcuts: SmartShortcut[]
  activity: ActivityItem[]
  bills: BillItem[]
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
    balance: 12450,
    income: 8500,
    expense: 3450,
    moneyLent: 1050,
    loan: 1900,
    charity: 500,
    todaySummary: {
      dateLabel: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      income: 620,
      expense: 210,
      moneyLent: 50,
      loan: 90,
      charity: 20
    },
    budgetSummary: {
      monthly: 12000,
      yearly: 144000
    },
    jobs: [
      { id: 'shops', label: 'Order from Shops', icon: '🛒', href: '/dashboard/transactions' },
      { id: 'rides', label: 'Book Auto / Car', icon: '🚕', href: '/dashboard/ledgerentry' },
      { id: 'bills', label: 'My Bills', icon: '🧾', href: '/dashboard/transactions?view=bills' },
      { id: 'add', label: 'Add Entry', icon: '➕', href: '/dashboard/ledgerentry?view=add-entry' }
    ],
    shortcuts: [
      { id: 's1', text: 'Reorder from Anand Stores', href: '/dashboard/transactions?shop=anand' },
      { id: 's2', text: 'Call Ravi Auto (last used)', href: '/dashboard/ledgerentry?driver=ravi' },
      { id: 's3', text: 'View latest bill from Fresh Mart', href: '/dashboard/transactions?bill=fresh-mart' }
    ],
    activity: [
      { id: 'a1', text: 'Paid ₹320 at Green Grocery', href: '/dashboard/transactions?activity=a1' },
      { id: 'a2', text: 'Ordered Rice & Oil from Fresh Mart', href: '/dashboard/transactions?activity=a2' },
      { id: 'a3', text: 'Auto ride with Ravi – ₹180', href: '/dashboard/ledgerentry?activity=a3' },
      { id: 'a4', text: 'Electricity Bill uploaded by Shop', href: '/dashboard/transactions?activity=a4' }
    ],
    bills: [
      { id: 'b1', shop: 'Fresh Mart', amount: 640, date: '2026-02-02', href: '/dashboard/transactions?bill=1' },
      { id: 'b2', shop: 'Green Grocery', amount: 320, date: '2026-01-30', href: '/dashboard/transactions?bill=2' },
      { id: 'b3', shop: 'City Electronics', amount: 1240, date: '2026-01-25', href: '/dashboard/transactions?bill=3' }
    ],
    transactions: [
      { id: '1', title: 'Salary', amount: 5000, type: 'income', date: '2026-01-28', href: '/dashboard/transactions?txn=1' },
      { id: '2', title: 'Groceries', amount: -210, type: 'expense', date: '2026-01-27', href: '/dashboard/transactions?txn=2' },
      { id: '3', title: 'Electricity Bill', amount: -120, type: 'expense', date: '2026-01-26', href: '/dashboard/transactions?txn=3' },
      { id: '4', title: 'Freelance Payment', amount: 1100, type: 'income', date: '2026-01-25', href: '/dashboard/transactions?txn=4' }
    ],
    budgets: [
      { id: 'bg1', name: 'Food', used: 120, total: 300 },
      { id: 'bg2', name: 'Travel', used: 450, total: 800 },
      { id: 'bg3', name: 'Shopping', used: 200, total: 500 }
    ],
    analytics: [
      { name: 'Jan', income: 4000, expense: 2400 },
      { name: 'Feb', income: 3000, expense: 1398 },
      { name: 'Mar', income: 5000, expense: 2800 },
      { name: 'Apr', income: 4780, expense: 3908 }
    ]
  }
}
