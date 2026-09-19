import { useQuery } from '@tanstack/react-query'

import { listTeams } from './api'

export function teamsQueryKey(workspaceId: string) {
  return ['teams', workspaceId] as const
}

export function useTeams(workspaceId: string | undefined) {
  return useQuery({
    queryKey: teamsQueryKey(workspaceId ?? ''),
    queryFn: () => listTeams(workspaceId ?? ''),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  })
}
