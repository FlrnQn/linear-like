import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createProject } from './api'
import { projectsQueryKey } from './use-projects'

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey(workspaceId) })
    },
  })
}
