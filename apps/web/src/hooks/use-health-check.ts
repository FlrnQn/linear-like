import type { HealthCheckResponse } from '@lynx/types'
import { useCallback, useEffect, useState } from 'react'

import { API_URL } from '@/lib/api'

type HealthCheckState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: HealthCheckResponse }
  | { status: 'error'; error: string }

export function useHealthCheck() {
  const [state, setState] = useState<HealthCheckState>({ status: 'idle' })

  const check = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const response = await fetch(`${API_URL}/health`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as HealthCheckResponse
      setState({ status: 'success', data })
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [])

  useEffect(() => {
    void check()
  }, [check])

  return { ...state, refetch: check }
}
