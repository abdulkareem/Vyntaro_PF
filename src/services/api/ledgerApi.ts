import { addCategory, addEntry, FinanceType, getCategories, getEntries } from './localFinanceStore'
import { apiUrl } from './baseUrl'

export type LedgerCategory = {
  id: string
  name: string
  type?: FinanceType
  showOnDashboard?: boolean
}

export type LedgerEntryInput = {
  type: FinanceType
  date: string
  item: string
  particulars: string
  amount: number
  categoryId?: string
  categoryName?: string
}

type ApiCategoryPayload = {
  categories?: LedgerCategory[]
  data?: LedgerCategory[]
  items?: LedgerCategory[]
}

function resolveCategories(payload: ApiCategoryPayload | LedgerCategory[]): LedgerCategory[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.categories)) return payload.categories
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.items)) return payload.items
  return []
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init)
  const text = await response.text()

  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    throw new Error(typeof data === 'string' && data ? data : `Request failed (${response.status})`)
  }

  return data as T
}

function isRouteMissing(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('404') || message.includes('not found') || message.includes('cannot')
}

async function tryPaths<T>(paths: string[], init?: RequestInit): Promise<T> {
  let lastError: unknown

  for (const [index, path] of paths.entries()) {
    try {
      return await request<T>(path, init)
    } catch (error) {
      lastError = error
      const isLast = index === paths.length - 1
      if (isLast || !isRouteMissing(error)) throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed')
}

export async function fetchLedgerCategories(type = 'expense'): Promise<LedgerCategory[]> {
  try {
    const payload = await tryPaths<ApiCategoryPayload | LedgerCategory[]>([
      `/api/ledger/categories?type=${encodeURIComponent(type)}`,
      `/api/ledgerentry/categories?type=${encodeURIComponent(type)}`,
      `/api/categories?type=${encodeURIComponent(type)}`
    ])

    return resolveCategories(payload)
  } catch {
    return getCategories(type as FinanceType)
  }
}

export async function createLedgerCategory(input: {
  name: string
  type?: FinanceType
  showOnDashboard?: boolean
}): Promise<LedgerCategory> {
  try {
    const payload = await tryPaths<LedgerCategory | { category: LedgerCategory }>([
      '/api/ledger/categories',
      '/api/ledgerentry/categories',
      '/api/categories'
    ], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })

    if ('category' in payload) return payload.category
    return payload
  } catch {
    return addCategory({ name: input.name, type: input.type || 'expense', showOnDashboard: input.showOnDashboard })
  }
}

export async function createLedgerEntry(input: LedgerEntryInput) {
  try {
    return await tryPaths<{ ok: boolean; id?: string; entryId?: string }>([
      '/api/ledger/entries',
      '/api/ledgerentry',
      '/api/entries'
    ], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
  } catch {
    let categoryId = input.categoryId
    if (!categoryId && input.categoryName) {
      categoryId = addCategory({ name: input.categoryName, type: input.type, showOnDashboard: true }).id
    }
    if (!categoryId) {
      throw new Error('Please select or create a category first.')
    }
    const entry = addEntry({
      type: input.type,
      date: input.date,
      item: input.item,
      particulars: input.particulars,
      amount: input.amount,
      categoryId
    })
    return { ok: true, id: entry.id, entryId: entry.id }
  }
}

export async function fetchLedgerEntries() {
  return getEntries()
}
