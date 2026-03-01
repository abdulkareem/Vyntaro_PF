import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardData, fetchDashboard } from '../services/api/dashboardApi'
import { ApiRequestError } from '../services/api/httpClient'

export function useDashboardData() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryable, setRetryable] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    setRetryable(false)

    try {
      const next = await fetchDashboard()
      setData(next)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        if (error.status === 404) {
          setError('Some dashboard features are not available in this environment yet.')
          setRetryable(false)
          return
        }

        if (error.status >= 500) {
          setError('We could not load the dashboard right now. Please retry.')
          setRetryable(true)
          return
        }
      }

      setError('Unable to load the dashboard right now.')
      setRetryable(false)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh, retryable }
}
