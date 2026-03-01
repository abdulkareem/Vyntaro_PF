const RAW_API_BASE = String(import.meta.env.VITE_API_BASE_URL || '').trim()
const IS_DEV = import.meta.env.DEV
const SAME_ORIGIN_FALLBACK_ENABLED =
  String(import.meta.env.VITE_API_ALLOW_SAME_ORIGIN_FALLBACK || '').toLowerCase() === 'true'

function normalizeBase(base: string) {
  const trimmed = base.trim().replace(/^['\"]+|['\"]+$/g, '')
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

export function canUseSameOriginFallback() {
  return IS_DEV || SAME_ORIGIN_FALLBACK_ENABLED
}

export function assertApiBaseConfigured() {
  if (API_BASE_URL || canUseSameOriginFallback()) return

  throw new Error(
    'VITE_API_BASE_URL is not configured. Set it to your Railway backend URL (for example: https://vyntaropfback-production.up.railway.app).'
  )
}

if (import.meta.env.DEV) {
  // Helps catch common deployment mistakes quickly (quotes, missing scheme, wrong host).
  // eslint-disable-next-line no-console
  console.info('[api] resolved base url', { raw: RAW_API_BASE, resolved: API_BASE_URL })
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  assertApiBaseConfigured()
  if (!API_BASE_URL) return normalizedPath
  return `${API_BASE_URL}${normalizedPath}`
}
