import type { CreateIssueInput, Issue, IssueStatus, UpdateIssueInput } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export interface ListIssuesParams {
  teamId: string
  status?: IssueStatus
  assigneeId?: string
}

export function listIssues(params: ListIssuesParams) {
  const search = new URLSearchParams({ teamId: params.teamId })
  if (params.status) search.set('status', params.status)
  if (params.assigneeId) search.set('assigneeId', params.assigneeId)
  return apiFetch<Issue[]>(`/issues?${search.toString()}`)
}

export function getIssue(id: string) {
  return apiFetch<Issue>(`/issues/${id}`)
}

export function createIssue(input: CreateIssueInput) {
  return apiFetch<Issue>('/issues', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateIssue(id: string, input: UpdateIssueInput) {
  return apiFetch<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteIssue(id: string) {
  return apiFetch<void>(`/issues/${id}`, { method: 'DELETE' })
}
