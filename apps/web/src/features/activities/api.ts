import type { Activity } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function listActivities(issueId: string) {
  return apiFetch<Activity[]>(`/activities?issueId=${issueId}`)
}
