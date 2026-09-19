import { useQuery } from '@tanstack/react-query'

import { getIssue } from './api'

export function issueQueryKey(id: string) {
  return ['issue', id] as const
}

export function useIssue(id: string | undefined) {
  return useQuery({
    queryKey: issueQueryKey(id ?? ''),
    queryFn: () => getIssue(id ?? ''),
    enabled: Boolean(id),
  })
}
