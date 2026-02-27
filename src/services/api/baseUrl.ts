const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim()

function normalizeBase(base: string) {
  return base.replace(/\/+$/, '')
}

export const API_BASE_URL = normalizeBase(RAW_API_BASE)

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) return normalizedPath
  return `${API_BASE_URL}${normalizedPath}`
}
