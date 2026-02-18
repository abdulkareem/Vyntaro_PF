import { currentUser } from '../auth'
import { fetchLedgerEntries, LedgerCategory } from './ledgerApi'
import { getCategories } from './localFinanceStore'

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

export type DashboardMetricCard = {
  id: string
  name: string
  amount: number
  href: string
}

export type DashboardData = {
  userName: string
  profilePhoto: string
  monthLabel: string
  balance: number
  income: number
  expense: number
  metricCards: DashboardMetricCard[]
  todaySummary: {
    dateLabel: string
    income: number
    expense: number
    cardTotals: DashboardMetricCard[]
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

function normalizeType(name: string): 'income' | 'expense' {
  return name.toLowerCase() === 'income' ? 'income' : 'expense'
}

function buildMetricCards(categories: LedgerCategory[], entries: Awaited<ReturnType<typeof fetchLedgerEntries>>) {
  return categories
    .filter(category => category.showOnDashboard)
    .map(category => {
      const amount = entries
        .filter(entry => entry.categoryId === category.id)
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)

      return {
        id: category.id,
        name: category.name,
        amount,
        href: `/dashboard/transactions?category=${encodeURIComponent(category.name)}`
      }
    })
}

export async function fetchDashboard(): Promise<DashboardData> {
  const user = currentUser()
  const displayName = user?.name || 'John Doe'

  await new Promise(resolve => setTimeout(resolve, 120))

  const categories = getCategories()
  const entries = await fetchLedgerEntries()
  const metricCards = buildMetricCards(categories, entries)
  const income = entries
    .filter(entry => normalizeType(entry.type) === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const expense = entries
    .filter(entry => normalizeType(entry.type) === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const balance = income - expense

  const todayDate = new Date().toISOString().slice(0, 10)
  const todayEntries = entries.filter(entry => entry.date === todayDate)
  const todayIncome = todayEntries
    .filter(entry => normalizeType(entry.type) === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const todayExpense = todayEntries
    .filter(entry => normalizeType(entry.type) === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const todayCardTotals = metricCards.map(card => ({
    ...card,
    amount: todayEntries
      .filter(entry => entry.categoryId === card.id)
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  }))

  const transactions = entries.slice(0, 6).map(entry => ({
    id: entry.id,
    title: entry.item,
    amount: normalizeType(entry.type) === 'income' ? entry.amount : -Math.abs(entry.amount),
    type: normalizeType(entry.type),
    date: entry.date,
    href: `/dashboard/transactions?txn=${entry.id}`
  }))

  return {
    userName: displayName,
    profilePhoto: user?.avatarUrl || fallbackAvatar(displayName),
    monthLabel: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    balance,
    income,
    expense,
    metricCards,
    todaySummary: {
      dateLabel: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      income: todayIncome,
      expense: todayExpense,
      cardTotals: todayCardTotals
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
    transactions,
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
