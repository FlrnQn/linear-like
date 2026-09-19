import type { CreateProjectInput, Project } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function listProjects(workspaceId: string) {
  return apiFetch<Project[]>(`/projects?workspaceId=${workspaceId}`)
}

export function createProject(input: CreateProjectInput) {
  return apiFetch<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
