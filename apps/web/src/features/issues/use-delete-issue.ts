import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteIssue } from './api'

export function useDeleteIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteIssue,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}
