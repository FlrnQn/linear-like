import type {
  CreateIssueInput,
  Issue,
  IssueStatus,
  PaginatedIssues,
  UpdateIssueInput,
} from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export interface ListIssuesParams {
  teamId?: string
  projectId?: string
  status?: IssueStatus
  assigneeId?: string
  cycleId?: string
  cursor?: string
  limit?: number
}

export function listIssues(params: ListIssuesParams) {
  const search = new URLSearchParams()
  if (params.teamId) search.set('teamId', params.teamId)
  if (params.projectId) search.set('projectId', params.projectId)
  if (params.status) search.set('status', params.status)
  if (params.assigneeId) search.set('assigneeId', params.assigneeId)
  if (params.cycleId) search.set('cycleId', params.cycleId)
  if (params.cursor) search.set('cursor', params.cursor)
  if (params.limit) search.set('limit', String(params.limit))
  return apiFetch<PaginatedIssues>(`/issues?${search.toString()}`)
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
