import type { PublicUser } from './auth'
import type { ActivityType } from './enums'

export interface Activity {
  id: string
  workspaceId: string
  issueId: string | null
  type: ActivityType
  metadata: Record<string, unknown> | null
  actor: PublicUser
  createdAt: string
}
