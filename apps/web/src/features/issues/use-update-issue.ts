import type { Issue, UpdateIssueInput } from '@lynx/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { activitiesQueryKey } from '@/features/activities/use-activities'

import { updateIssue } from './api'
import { issueQueryKey } from './use-issue'

interface UpdateIssueVars {
  issueId: string
  input: UpdateIssueInput
}

interface UpdateIssueContext {
  previousIssue: Issue | undefined
  previousLists: [readonly unknown[], Issue[] | undefined][]
}

// Only fields that map 1:1 onto the Issue shape are applied optimistically.
// assigneeId/labelIds need to resolve to nested user/label objects, so those
// changes wait for the server response instead of risking a wrong optimistic render.
function patchIssue(issue: Issue, input: UpdateIssueInput): Issue {
  return {
    ...issue,
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.estimate !== undefined && { estimate: input.estimate }),
    ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
  }
}

export function useUpdateIssue() {
  const queryClient = useQueryClient()

  return useMutation<Issue, Error, UpdateIssueVars, UpdateIssueContext>({
    mutationFn: ({ issueId, input }) => updateIssue(issueId, input),
    onMutate: async ({ issueId, input }) => {
      await queryClient.cancelQueries({ queryKey: issueQueryKey(issueId) })
      await queryClient.cancelQueries({ queryKey: ['issues'] })

      const previousIssue = queryClient.getQueryData<Issue>(issueQueryKey(issueId))
      if (previousIssue) {
        queryClient.setQueryData<Issue>(issueQueryKey(issueId), patchIssue(previousIssue, input))
      }

      const previousLists: [readonly unknown[], Issue[] | undefined][] = []
      queryClient
        .getQueryCache()
        .findAll({ queryKey: ['issues'] })
        .forEach((query) => {
          const data = query.state.data as Issue[] | undefined
          previousLists.push([query.queryKey, data])
          if (data) {
            queryClient.setQueryData<Issue[]>(
              query.queryKey,
              data.map((issue) => (issue.id === issueId ? patchIssue(issue, input) : issue)),
            )
          }
        })

      return { previousIssue, previousLists }
    },
    onError: (_error, { issueId }, context) => {
      if (context?.previousIssue) {
        queryClient.setQueryData(issueQueryKey(issueId), context.previousIssue)
      }
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: (_data, _error, { issueId }) => {
      void queryClient.invalidateQueries({ queryKey: issueQueryKey(issueId) })
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
      void queryClient.invalidateQueries({ queryKey: activitiesQueryKey(issueId) })
    },
  })
}
