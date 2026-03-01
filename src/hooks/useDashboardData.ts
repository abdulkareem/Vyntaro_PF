import { useCallback, useEffect, useState } from 'react'
import { DashboardData, fetchDashboard } from '../services/api/dashboardApi'
import { toUserFacingError } from '../services/userMessage'

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const next = await fetchDashboard()
      setData(next)
    } catch (error) {
      setError(toUserFacingError(error, 'We could not load your dashboard right now. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
