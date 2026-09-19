import { useQuery } from '@tanstack/react-query'

import { listCycles } from './api'

export function cyclesQueryKey(teamId: string) {
  return ['cycles', teamId] as const
}

export function useCycles(teamId: string | undefined) {
  return useQuery({
    queryKey: cyclesQueryKey(teamId ?? ''),
    queryFn: () => listCycles(teamId ?? ''),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  })
}
