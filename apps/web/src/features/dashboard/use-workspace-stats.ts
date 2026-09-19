import { useQuery } from '@tanstack/react-query'

import { getWorkspaceStats } from './api'

export function workspaceStatsQueryKey(workspaceId: string) {
  return ['workspace-stats', workspaceId] as const
}

export function useWorkspaceStats(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceStatsQueryKey(workspaceId ?? ''),
    queryFn: () => getWorkspaceStats(workspaceId ?? ''),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  })
}
