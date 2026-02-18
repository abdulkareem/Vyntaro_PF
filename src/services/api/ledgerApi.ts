const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export type LedgerCategory = {
  id: string
  name: string
}

export type LedgerEntryInput = {
  type: 'expense' | 'income' | 'bill' | 'ledger'
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
  const response = await fetch(`${API_BASE}${path}`, init)
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
  const payload = await tryPaths<ApiCategoryPayload | LedgerCategory[]>([
    `/api/ledger/categories?type=${encodeURIComponent(type)}`,
    `/api/ledgerentry/categories?type=${encodeURIComponent(type)}`,
    `/api/categories?type=${encodeURIComponent(type)}`
  ])

  return resolveCategories(payload)
}

export async function createLedgerCategory(name: string): Promise<LedgerCategory> {
  const payload = await tryPaths<LedgerCategory | { category: LedgerCategory }>([
    '/api/ledger/categories',
    '/api/ledgerentry/categories',
    '/api/categories'
  ], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })

  if ('category' in payload) return payload.category
  return payload
}

export async function createLedgerEntry(input: LedgerEntryInput) {
  return tryPaths<{ ok: boolean; id?: string; entryId?: string }>([
    '/api/ledger/entries',
    '/api/ledgerentry',
    '/api/entries'
  ], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
}
