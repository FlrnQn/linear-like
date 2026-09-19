import type { CreateWorkspaceInput, Workspace } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function listWorkspaces() {
  return apiFetch<Workspace[]>('/workspaces')
}

export function createWorkspace(input: CreateWorkspaceInput) {
  return apiFetch<Workspace>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
