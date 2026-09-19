import { useQuery } from '@tanstack/react-query'

import { getTeam } from './api'

export function teamQueryKey(id: string) {
  return ['team', id] as const
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: teamQueryKey(id),
    queryFn: () => getTeam(id),
  })
}
