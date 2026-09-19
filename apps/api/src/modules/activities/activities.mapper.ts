import type { Activity, ActivityType } from '@lynx/types'

import { toPublicUser } from '../users/users.mapper'

interface ActivityRow {
  id: string
  workspaceId: string
  issueId: string | null
  type: ActivityType
  metadata: Record<string, unknown> | null
  createdAt: Date
  actor: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    createdAt: Date
  }
}

export function toPublicActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    issueId: row.issueId,
    type: row.type,
    metadata: row.metadata,
    actor: toPublicUser(row.actor),
    createdAt: row.createdAt.toISOString(),
  }
}
