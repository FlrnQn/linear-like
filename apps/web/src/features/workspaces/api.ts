import type { CreateWorkspaceInput, Workspace, WorkspaceMember } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function listWorkspaces() {
  return apiFetch<Workspace[]>('/workspaces')
}

export function listWorkspaceMembers(workspaceId: string) {
  return apiFetch<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`)
}

export function createWorkspace(input: CreateWorkspaceInput) {
  return apiFetch<Workspace>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
