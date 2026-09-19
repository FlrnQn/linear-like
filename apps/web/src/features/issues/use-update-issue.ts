import type { Issue, UpdateIssueInput } from '@lynx/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { activitiesQueryKey } from '@/features/activities/use-activities'

import { updateIssue } from './api'
import { issueQueryKey } from './use-issue'

interface UpdateIssueContext {
  previous: Issue | undefined
}

export function useUpdateIssue(issueId: string) {
  const queryClient = useQueryClient()

  return useMutation<Issue, Error, UpdateIssueInput, UpdateIssueContext>({
    mutationFn: (input) => updateIssue(issueId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: issueQueryKey(issueId) })
      const previous = queryClient.getQueryData<Issue>(issueQueryKey(issueId))

      // Only fields that map 1:1 onto the Issue shape are applied optimistically.
      // assigneeId/labelIds need to resolve to nested user/label objects, so those
      // changes wait for the server response instead of risking a wrong optimistic render.
      if (previous) {
        queryClient.setQueryData<Issue>(issueQueryKey(issueId), {
          ...previous,
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.estimate !== undefined && { estimate: input.estimate }),
        })
      }

      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(issueQueryKey(issueId), context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: issueQueryKey(issueId) })
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      void queryClient.invalidateQueries({ queryKey: activitiesQueryKey(issueId) })
    },
  })
}
