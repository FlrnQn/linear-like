import type { Comment, CreateCommentInput } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function listComments(issueId: string) {
  return apiFetch<Comment[]>(`/comments?issueId=${issueId}`)
}

export function createComment(input: CreateCommentInput) {
  return apiFetch<Comment>('/comments', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
