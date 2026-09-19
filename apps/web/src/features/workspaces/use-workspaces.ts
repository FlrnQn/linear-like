import { useQuery } from '@tanstack/react-query'

import { listWorkspaces } from './api'

export const workspacesQueryKey = ['workspaces'] as const

export function useWorkspaces() {
  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: listWorkspaces,
    staleTime: 30_000,
  })
}
