import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardData, fetchDashboard } from '../services/api/dashboardApi'
import { ApiRequestError } from '../services/api/httpClient'
import { isAuthenticated } from '../services/auth'

type DashboardErrorState = {
  message: string
  retryable: boolean
  code?: number
}

const DASHBOARD_CACHE_TTL_MS = 60_000

let dashboardCache: {
  data: DashboardData
  updatedAt: number
} | null = null

export function clearDashboardCache() {
  dashboardCache = null
}

export function useDashboardData() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(dashboardCache?.data ?? null)
  const [loading, setLoading] = useState(!dashboardCache)
  const [error, setError] = useState<DashboardErrorState | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = useCallback(async (force = false) => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true })
      return
    }

    const hasFreshCache = Boolean(
      !force
      && dashboardCache
      && Date.now() - dashboardCache.updatedAt < DASHBOARD_CACHE_TTL_MS
    )

    if (hasFreshCache && dashboardCache) {
      setData(dashboardCache.data)
      setLoading(false)
      setError(null)
      return
    }

    if (!dashboardCache) setLoading(true)
    setIsRefreshing(true)
    setError(null)

    try {
      const next = await fetchDashboard()
      dashboardCache = { data: next, updatedAt: Date.now() }
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
            message: 'No data found yet. Add your first transaction to get started.',
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
    } finally {
      if (!mountedRef.current) return
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [navigate])

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
    refresh: () => refresh(true)
  }
}
