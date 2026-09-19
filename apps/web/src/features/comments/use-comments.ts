import { useQuery } from '@tanstack/react-query'

import { listComments } from './api'

export function commentsQueryKey(issueId: string) {
  return ['comments', issueId] as const
}

export function useComments(issueId: string | undefined) {
  return useQuery({
    queryKey: commentsQueryKey(issueId ?? ''),
    queryFn: () => listComments(issueId ?? ''),
    enabled: Boolean(issueId),
    staleTime: 10_000,
  })
}
