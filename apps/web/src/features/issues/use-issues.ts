import { useQuery } from '@tanstack/react-query'

import { listIssues } from './api'
import type { ListIssuesParams } from './api'

export function issuesQueryKey(params: ListIssuesParams) {
  return ['issues', params] as const
}

export function useIssues(params: ListIssuesParams) {
  return useQuery({
    queryKey: issuesQueryKey(params),
    queryFn: () => listIssues(params),
    staleTime: 15_000,
  })
}
