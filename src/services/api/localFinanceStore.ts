export type FinanceType = 'expense' | 'income' | 'bill' | 'ledger'

export type StoredCategory = {
  id: string
  name: string
  type: FinanceType
  showOnDashboard: boolean
  createdAt: string
}

export type StoredEntry = {
  id: string
  type: FinanceType
  date: string
  item: string
  particulars: string
  amount: number
  categoryId: string
  createdAt: string
}

type FinanceStore = {
  categories: StoredCategory[]
  entries: StoredEntry[]
}

const STORAGE_KEY = 'vyntaro.finance.v1'

const defaultCategories: StoredCategory[] = [
  { id: 'cat-income', name: 'Income', type: 'income', showOnDashboard: true, createdAt: new Date().toISOString() },
  { id: 'cat-expense', name: 'Expense', type: 'expense', showOnDashboard: true, createdAt: new Date().toISOString() },
  { id: 'cat-money-lent', name: 'Money Lent', type: 'ledger', showOnDashboard: true, createdAt: new Date().toISOString() },
  { id: 'cat-loan', name: 'Loan', type: 'ledger', showOnDashboard: true, createdAt: new Date().toISOString() },
  { id: 'cat-charity', name: 'Charity', type: 'expense', showOnDashboard: true, createdAt: new Date().toISOString() }
]

function readStore(): FinanceStore {
  if (typeof window === 'undefined') return { categories: defaultCategories, entries: [] }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const initial = { categories: defaultCategories, entries: [] }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FinanceStore>
    return {
      categories: Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : defaultCategories,
      entries: Array.isArray(parsed.entries) ? parsed.entries : []
    }
  } catch {
    const fallback = { categories: defaultCategories, entries: [] }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback))
    return fallback
  }
}

function writeStore(store: FinanceStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function getCategories(type?: FinanceType): StoredCategory[] {
  const store = readStore()
  if (!type) return store.categories
  return store.categories.filter(category => category.type === type)
}

export function addCategory(input: { name: string; type: FinanceType; showOnDashboard?: boolean }): StoredCategory {
  const store = readStore()
  const normalized = input.name.trim()
  const existing = store.categories.find(category => category.name.toLowerCase() === normalized.toLowerCase())
  if (existing) return existing

  const category: StoredCategory = {
    id: `cat-${slugify(normalized)}-${Math.random().toString(36).slice(2, 7)}`,
    name: normalized,
    type: input.type,
    showOnDashboard: input.showOnDashboard ?? true,
    createdAt: new Date().toISOString()
  }

  const next = { ...store, categories: [category, ...store.categories] }
  writeStore(next)
  return category
}

export function addEntry(input: {
  type: FinanceType
  date: string
  item: string
  particulars: string
  amount: number
  categoryId: string
}): StoredEntry {
  const store = readStore()
  const entry: StoredEntry = {
    id: `ent-${Math.random().toString(36).slice(2, 10)}`,
    type: input.type,
    date: input.date,
    item: input.item,
    particulars: input.particulars,
    amount: input.amount,
    categoryId: input.categoryId,
    createdAt: new Date().toISOString()
  }

  writeStore({ ...store, entries: [entry, ...store.entries] })
  return entry
}

export function getEntries(): StoredEntry[] {
  return readStore().entries
}
