const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim()

function normalizeBase(base: string) {
  const trimmed = base.trim()
  if (!trimmed) return ''

  const isLocalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(trimmed)

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `${isLocalHost ? 'http' : 'https'}://${trimmed}`

  try {
    const parsed = new URL(withScheme)
    return parsed.origin
  } catch {
    return trimmed.replace(/\/+$/, '')
  }
}

export const API_BASE_URL = normalizeBase(RAW_API_BASE)

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) return normalizedPath
  return `${API_BASE_URL}${normalizedPath}`
}
