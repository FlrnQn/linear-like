import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createTeam } from './api'
import { teamsQueryKey } from './use-teams'

export function useCreateTeam(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamsQueryKey(workspaceId) })
    },
  })
}
