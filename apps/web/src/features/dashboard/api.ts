import type { WorkspaceStats } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function getWorkspaceStats(workspaceId: string) {
  return apiFetch<WorkspaceStats>(`/workspaces/${workspaceId}/stats`)
}
