import { ApiRequestError, requestJson, requestJsonWithPathFallback } from './httpClient'

export type FinanceType = 'expense' | 'income' | 'bill' | 'ledger'

export type LedgerCategory = {
  id: string
  name: string
  type?: FinanceType
  showOnDashboard?: boolean
}

export type LedgerEntry = {
  id: string
  type: FinanceType
  date: string
  item: string
  particulars: string
  amount: number
  categoryId: string
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

type ApiEntriesPayload = {
  entries?: LedgerEntry[]
  data?: LedgerEntry[]
  items?: LedgerEntry[]
}

function resolveCategories(payload: ApiCategoryPayload | LedgerCategory[]): LedgerCategory[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.categories)) return payload.categories
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.items)) return payload.items
  return []
}

function resolveEntries(payload: ApiEntriesPayload | LedgerEntry[]): LedgerEntry[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.entries)) return payload.entries
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.items)) return payload.items
  return []
}

export async function fetchLedgerCategories(type = 'expense'): Promise<LedgerCategory[]> {
  const payload = await requestJsonWithPathFallback<ApiCategoryPayload | LedgerCategory[]>([
    `/api/ledger/categories?type=${encodeURIComponent(type)}`,
    `/ledger/categories?type=${encodeURIComponent(type)}`
  ])
  return resolveCategories(payload)
}

export async function createLedgerCategory(input: {
  name: string
  type?: FinanceType
  showOnDashboard?: boolean
}): Promise<LedgerCategory> {
  const payload = await requestJsonWithPathFallback<LedgerCategory | { category: LedgerCategory }>(['/api/ledger/categories', '/ledger/categories'], {
    method: 'POST',
    body: input
  })

  if (payload && typeof payload === 'object' && 'category' in payload) return payload.category
  return payload as LedgerCategory
}

export async function createLedgerEntry(input: LedgerEntryInput) {
  if (!input.categoryId && !input.categoryName?.trim()) {
    throw new Error('Please select or create a category first.')
  }

  return requestJsonWithPathFallback<{ ok: boolean; id?: string; entryId?: string }>(['/api/ledger/entries', '/ledger/entries'], {
    method: 'POST',
    body: input
  })
}

export async function fetchLedgerEntries() {
  try {
    const payload = await requestJsonWithPathFallback<ApiEntriesPayload | LedgerEntry[]>(['/api/ledger/entries', '/ledger/entries'])
    return resolveEntries(payload)
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return []
    throw error
  }
}
