import { useQuery } from '@tanstack/react-query'

import { listProjects } from './api'

export function projectsQueryKey(workspaceId: string) {
  return ['projects', workspaceId] as const
}

export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: projectsQueryKey(workspaceId ?? ''),
    queryFn: () => listProjects(workspaceId ?? ''),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  })
}
