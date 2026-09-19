import { useQuery } from '@tanstack/react-query'

import { listWorkspaceMembers } from './api'

export function workspaceMembersQueryKey(workspaceId: string) {
  return ['workspace-members', workspaceId] as const
}

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceMembersQueryKey(workspaceId ?? ''),
    queryFn: () => listWorkspaceMembers(workspaceId ?? ''),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  })
}
