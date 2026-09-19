import { useQuery } from '@tanstack/react-query'

import { listActivities } from './api'

export function activitiesQueryKey(issueId: string) {
  return ['activities', issueId] as const
}

export function useActivities(issueId: string | undefined) {
  return useQuery({
    queryKey: activitiesQueryKey(issueId ?? ''),
    queryFn: () => listActivities(issueId ?? ''),
    enabled: Boolean(issueId),
    staleTime: 10_000,
  })
}
