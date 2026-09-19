import type { CreateTeamInput, Team } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function listTeams(workspaceId: string) {
  return apiFetch<Team[]>(`/teams?workspaceId=${workspaceId}`)
}

export function createTeam(input: CreateTeamInput) {
  return apiFetch<Team>('/teams', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
