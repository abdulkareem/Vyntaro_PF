import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDashboardFallback, DashboardData, fetchDashboard } from '../services/api/dashboardApi'
import { currentUser } from '../services/auth'
import { ApiRequestError } from '../services/api/httpClient'
import { isAuthenticated } from '../services/auth'

type DashboardErrorState = {
  message: string
  retryable: boolean
  code?: number
}

const DASHBOARD_CACHE_TTL_MS = 60_000

type CacheEntry = {
  data: DashboardData
  updatedAt: number
}

const dashboardCache = new Map<string, CacheEntry>()

function normalizeMonthKey(monthKey?: string) {
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) return monthKey
  return new Date().toISOString().slice(0, 7)
}

export function clearDashboardCache(monthKey?: string) {
  if (monthKey) {
    dashboardCache.delete(normalizeMonthKey(monthKey))
    return
  }
  dashboardCache.clear()
}

export function useDashboardData(monthKey?: string) {
  const navigate = useNavigate()
  const normalizedMonth = useMemo(() => normalizeMonthKey(monthKey), [monthKey])
  const cachedEntry = dashboardCache.get(normalizedMonth) ?? null
  const [data, setData] = useState<DashboardData | null>(cachedEntry?.data ?? null)
  const [loading, setLoading] = useState(!cachedEntry)
  const [error, setError] = useState<DashboardErrorState | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const latestCached = dashboardCache.get(normalizedMonth)
    setData(latestCached?.data ?? null)
    setLoading(!latestCached)
  }, [normalizedMonth])

  const refresh = useCallback(async (force = false) => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true })
      return
    }

    const cached = dashboardCache.get(normalizedMonth)
    const hasFreshCache = Boolean(
      !force
      && cached
      && Date.now() - cached.updatedAt < DASHBOARD_CACHE_TTL_MS
    )

    if (hasFreshCache && cached) {
      setData(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    if (!cached) setLoading(true)
    setIsRefreshing(true)
    setError(null)

    try {
      const next = await fetchDashboard(normalizedMonth)
      dashboardCache.set(normalizedMonth, { data: next, updatedAt: Date.now() })
      if (!mountedRef.current) return
      setData(next)
      setError(null)
    } catch (requestError) {
      if (!mountedRef.current) return

      if (requestError instanceof ApiRequestError) {
        if (requestError.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        if (requestError.status === 403) {
          setError({
            message: 'You do not have permission to view this section.',
            retryable: false,
            code: 403
          })
          return
        }

        if (requestError.status === 404) {
          setError({
            message: 'No dashboard summary exists for this month yet.',
            retryable: false,
            code: 404
          })
          return
        }

        if (requestError.status >= 500) {
          setError({
            message: 'Server error while loading dashboard data. Please try again.',
            retryable: true,
            code: requestError.status
          })
          return
        }
      }

      setError({
        message: 'Unable to load dashboard data right now.',
        retryable: true
      })

      const fallbackData = createDashboardFallback(normalizedMonth)
      const user = currentUser()
      if (user?.name?.trim()) {
        fallbackData.userName = user.name.trim()
      } else if (user?.mobile) {
        fallbackData.userName = user.mobile
      }
      setData(fallbackData)
    } finally {
      if (!mountedRef.current) return
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [navigate, normalizedMonth])

  useEffect(() => {
    void refresh(false)
  }, [refresh])

  return {
    data,
    loading,
    isRefreshing,
    error: error?.message ?? null,
    errorCode: error?.code,
    retryable: error?.retryable ?? false,
    selectedMonth: normalizedMonth,
    refresh: () => refresh(true)
  }
}
