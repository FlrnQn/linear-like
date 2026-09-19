import { useQuery } from '@tanstack/react-query'

import { getProject } from './api'

export function projectQueryKey(id: string) {
  return ['project', id] as const
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectQueryKey(id),
    queryFn: () => getProject(id),
  })
}
