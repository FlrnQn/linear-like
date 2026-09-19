import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createWorkspace } from './api'
import { workspacesQueryKey } from './use-workspaces'

export function useCreateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey })
    },
  })
}
