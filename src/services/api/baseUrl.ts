const DEFAULT_PROD_API_BASE = 'https://vyntaropfback-production.up.railway.app'
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

const resolvedEnvBase = normalizeBase(RAW_API_BASE)
const shouldUseDefaultProdBase = !resolvedEnvBase && !IS_DEV && !SAME_ORIGIN_FALLBACK_ENABLED

export const API_BASE_URL = shouldUseDefaultProdBase
  ? normalizeBase(DEFAULT_PROD_API_BASE)
  : resolvedEnvBase

export function canUseSameOriginFallback() {
  return IS_DEV || SAME_ORIGIN_FALLBACK_ENABLED
}

export function assertApiBaseConfigured() {
  if (API_BASE_URL || canUseSameOriginFallback()) return

  throw new Error(
    'VITE_API_BASE_URL is not configured. Set it to your Railway backend URL (for example: https://vyntaropfback-production.up.railway.app).'
  )
}


if (shouldUseDefaultProdBase) {
  // eslint-disable-next-line no-console
  console.warn('[api] VITE_API_BASE_URL is missing in production. Falling back to default Railway backend URL.', { resolved: API_BASE_URL })
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
