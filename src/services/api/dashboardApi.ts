import { currentUser } from '../auth'
import { requestJson } from './httpClient'

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

export type FinancialHealth = {
  score: number
  label: 'Good' | 'Average' | 'Risky'
}

export type NetWorthSummary = {
  netWorth: number
  savingsThisMonth: number
}

export type ExpenseBreakdownItem = {
  category: string
  amount: number
}

export type SmartAlert = {
  type: 'warning' | 'info' | 'success'
  message: string
}

export type BalancePrediction = {
  projectedBalance: number
}

export type LendingPerson = {
  person: string
  amount: number
  kind: 'lent' | 'loan'
  overdue: boolean
  dueDate?: string
}

export type LendingSummary = {
  totalLent: number
  totalLoan: number
  breakdown: LendingPerson[]
  agingBuckets: {
    bucket: '0-30' | '31-60' | '61-90' | '90+'
    count: number
    amount: number
  }[]
}

export type DashboardInsights = {
  financialHealth: FinancialHealth
  netWorth: NetWorthSummary
  expenseBreakdown: ExpenseBreakdownItem[]
  alerts: SmartAlert[]
  prediction: BalancePrediction
  lendingSummary: LendingSummary
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
  insights: DashboardInsights
  ledgerCategoriesState: {
    message: string | null
    retryable: boolean
  }
}

type DashboardSummaryResponse = DashboardData | {
  summary?: DashboardData
  data?: DashboardData
}

function fallbackAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`
}

function normalizeMonthKey(monthKey?: string) {
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) return monthKey
  return new Date().toISOString().slice(0, 7)
}

function toMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function metricCardRoute(name: string, fallbackHref?: string) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  if (normalized === 'income') return '/dashboard/analytics/income'
  if (normalized === 'expense') return '/dashboard/analytics/expenses'
  if (normalized.includes('charity')) return '/dashboard/categories/charity'
  if (normalized.includes('money lent') || normalized === 'lent') return '/dashboard/lending?kind=lent'
  if (normalized.includes('loan')) return '/dashboard/lending?kind=loan'
  if (fallbackHref) return fallbackHref
  return `/dashboard/categories/${encodeURIComponent(name)}`
}

export function createDashboardFallback(monthKey?: string): DashboardData {
  const resolvedMonth = normalizeMonthKey(monthKey)
  const user = currentUser()
  const displayName = user?.name?.trim() || 'User'

  return {
    userName: displayName,
    profilePhoto: user?.avatarUrl || fallbackAvatar(displayName),
    monthLabel: toMonthLabel(resolvedMonth),
    balance: 0,
    income: 0,
    expense: 0,
    metricCards: [],
    todaySummary: {
      dateLabel: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      income: 0,
      expense: 0,
      cardTotals: []
    },
    budgetSummary: {
      monthly: 0,
      yearly: 0
    },
    jobs: [],
    shortcuts: [],
    activity: [],
    bills: [],
    transactions: [],
    budgets: [],
    analytics: [],
    insights: {
      financialHealth: { score: 0, label: 'Average' },
      netWorth: { netWorth: 0, savingsThisMonth: 0 },
      expenseBreakdown: [],
      alerts: [],
      prediction: { projectedBalance: 0 },
      lendingSummary: {
        totalLent: 0,
        totalLoan: 0,
        breakdown: [],
        agingBuckets: [
          { bucket: '0-30', count: 0, amount: 0 },
          { bucket: '31-60', count: 0, amount: 0 },
          { bucket: '61-90', count: 0, amount: 0 },
          { bucket: '90+', count: 0, amount: 0 }
        ]
      }
    },
    ledgerCategoriesState: { message: null, retryable: false }
  }
}

function resolveSummary(payload: DashboardSummaryResponse): DashboardData | null {
  if (payload && typeof payload === 'object') {
    if ('balance' in payload) return payload as DashboardData
    if ('summary' in payload && payload.summary) return payload.summary
    if ('data' in payload && payload.data) return payload.data
  }

  return null
}

function mergeDashboardDefaults(summary: DashboardData | null, monthKey: string) {
  const base = createDashboardFallback(monthKey)
  if (!summary) return base

  const currentUserName = currentUser()?.name?.trim()

  return {
    ...base,
    ...summary,
    userName: currentUserName || summary.userName || base.userName,
    monthLabel: summary.monthLabel || base.monthLabel,
    balance: Number(summary.balance || 0),
    income: Number(summary.income || 0),
    expense: Number(summary.expense || 0),
    metricCards: (summary.metricCards || []).map(card => ({
      ...card,
      amount: Number(card.amount || 0),
      href: metricCardRoute(card.name, card.href)
    })),
    budgetSummary: {
      monthly: Number(summary.budgetSummary?.monthly || 0),
      yearly: Number(summary.budgetSummary?.yearly || 0)
    },
    insights: {
      ...base.insights,
      ...summary.insights,
      lendingSummary: {
        ...base.insights.lendingSummary,
        ...summary.insights?.lendingSummary
      }
    }
  }
}

export async function fetchDashboard(monthKey?: string): Promise<DashboardData> {
  const targetMonth = normalizeMonthKey(monthKey)
  const payload = await requestJson<DashboardSummaryResponse>(`/api/dashboard/summary?month=${encodeURIComponent(targetMonth)}`, { useCredentials: true })
  const summary = resolveSummary(payload)
  return mergeDashboardDefaults(summary, targetMonth)
}
