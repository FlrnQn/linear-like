import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createLabel } from './api'
import { labelsQueryKey } from './use-labels'

export function useCreateLabel(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLabel,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: labelsQueryKey(workspaceId) })
    },
  })
}
