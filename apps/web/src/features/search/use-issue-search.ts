import { useQuery } from '@tanstack/react-query'

import { searchIssues } from './api'

export function useIssueSearch(workspaceId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['search', workspaceId, query],
    queryFn: () => searchIssues(workspaceId ?? '', query),
    enabled: Boolean(workspaceId) && query.trim().length > 0,
    staleTime: 10_000,
  })
}
