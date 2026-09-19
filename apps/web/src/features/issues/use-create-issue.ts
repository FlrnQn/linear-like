import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createIssue } from './api'

export function useCreateIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}
