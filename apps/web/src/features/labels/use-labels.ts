import { useQuery } from '@tanstack/react-query'

import { listLabels } from './api'

export function labelsQueryKey(workspaceId: string) {
  return ['labels', workspaceId] as const
}

export function useLabels(workspaceId: string | undefined) {
  return useQuery({
    queryKey: labelsQueryKey(workspaceId ?? ''),
    queryFn: () => listLabels(workspaceId ?? ''),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  })
}
