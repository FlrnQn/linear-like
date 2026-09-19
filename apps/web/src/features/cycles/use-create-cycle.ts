import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createCycle } from './api'
import { cyclesQueryKey } from './use-cycles'

export function useCreateCycle(teamId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCycle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cyclesQueryKey(teamId) })
    },
  })
}
