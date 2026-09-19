import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { listIssues } from './api'
import type { ListIssuesParams } from './api'

// Kanban needs every issue in memory at once to group/reorder by status, so it
// takes one capped page instead of paging — the max the API allows (500).
const KANBAN_PAGE_LIMIT = 500
const LIST_PAGE_SIZE = 50

export function issuesQueryKey(params: ListIssuesParams) {
  return ['issues', 'page', params] as const
}

export function useIssues(params: ListIssuesParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: issuesQueryKey(params),
    queryFn: () => listIssues({ ...params, limit: KANBAN_PAGE_LIMIT }),
    staleTime: 15_000,
    enabled: options?.enabled,
  })
}

export function infiniteIssuesQueryKey(params: ListIssuesParams) {
  return ['issues', 'infinite', params] as const
}

export function useInfiniteIssues(params: ListIssuesParams, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: infiniteIssuesQueryKey(params),
    queryFn: ({ pageParam }) => listIssues({ ...params, limit: LIST_PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 15_000,
    enabled: options?.enabled,
  })
}
