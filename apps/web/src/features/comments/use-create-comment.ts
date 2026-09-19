import { useMutation, useQueryClient } from '@tanstack/react-query'

import { activitiesQueryKey } from '@/features/activities/use-activities'

import { createComment } from './api'
import { commentsQueryKey } from './use-comments'

export function useCreateComment(issueId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentsQueryKey(issueId) })
      void queryClient.invalidateQueries({ queryKey: activitiesQueryKey(issueId) })
    },
  })
}
