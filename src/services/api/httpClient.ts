import { API_BASE_URL, assertApiBaseConfigured, canUseSameOriginFallback } from './baseUrl'

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  authToken?: string
  timeoutMs?: number
  useCredentials?: boolean
}

function getBaseCandidates() {
  assertApiBaseConfigured()
  const candidates = [API_BASE_URL]
  if (canUseSameOriginFallback()) candidates.push('')
  return Array.from(new Set(candidates.map(base => base.replace(/\/$/, ''))))
}

function withTimeout(ms: number) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), ms)
  return { controller, timeoutId }
}

function extractErrorMessage(payload: unknown) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (!payload || typeof payload !== 'object') return null

  const typed = payload as {
    message?: unknown
    error?: unknown
    fieldErrors?: Record<string, string[] | string>
    formErrors?: string[]
  }

  if (typed.fieldErrors && typeof typed.fieldErrors === 'object') {
    const firstFieldError = Object.entries(typed.fieldErrors).find(([, value]) => {
      if (Array.isArray(value)) return Boolean(value.find(Boolean))
      return Boolean(value)
    })

    if (firstFieldError) {
      const [field, value] = firstFieldError
      const message = Array.isArray(value) ? value.find(Boolean) : value
      if (message) return `${field}: ${String(message)}`
    }
  }

  if (Array.isArray(typed.formErrors) && typed.formErrors.length > 0) {
    return String(typed.formErrors[0])
  }

  if (typeof typed.message === 'string' && typed.message.trim()) return typed.message
  if (typeof typed.error === 'string' && typed.error.trim()) return typed.error
  return null
}

function isMissingRouteError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('cannot') || message.includes('not found') || message.includes('404')
}

async function requestAgainstBase<T>(base: string, path: string, options: RequestOptions): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 15000
  const endpoint = `${base}${path}`
  const { controller, timeoutId } = withTimeout(timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {}),
        ...(options.headers || {})
      },
      ...(typeof options.body === 'undefined' ? {} : { body: JSON.stringify(options.body) }),
      mode: 'cors',
      credentials: options.useCredentials ? 'include' : 'same-origin',
      signal: controller.signal
    })

    if (response.status === 204) return null as T

    const raw = await response.text()
    let payload: unknown = null

    if (raw) {
      try {
        payload = JSON.parse(raw)
      } catch {
        payload = raw
      }
    }

    if (!response.ok) {
      const message = extractErrorMessage(payload) || `Request failed (${response.status})`
      throw new Error(message)
    }

    return payload as T
  } catch (error) {
    const isAbortError = error instanceof DOMException && error.name === 'AbortError'
    if (isAbortError) {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${endpoint}`)
    }

    if (error instanceof TypeError) {
      throw new Error(`Network/CORS error while reaching ${endpoint}. Verify API base URL and backend CORS allowlist.`)
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function requestJson<T>(path: string, options: RequestOptions = {}) {
  let lastError: unknown

  const candidates = getBaseCandidates()

  for (const [index, base] of candidates.entries()) {
    try {
      return await requestAgainstBase<T>(base, path, options)
    } catch (error) {
      lastError = error
      const isLast = index === candidates.length - 1
      if (isLast) throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed')
}

export async function requestJsonWithPathFallback<T>(paths: string[], options: RequestOptions = {}) {
  let lastError: unknown

  for (const [index, path] of paths.entries()) {
    try {
      return await requestJson<T>(path, options)
    } catch (error) {
      lastError = error
      const isLast = index === paths.length - 1
      if (isLast || !isMissingRouteError(error)) throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed')
}
