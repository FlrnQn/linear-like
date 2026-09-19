import type { Comment, Issue, Project } from '@lynx/types'

import { redis } from '../db/redis'

export const WORKSPACE_EVENTS_CHANNEL = 'workspace:events'

export type WorkspaceEvent =
  | { type: 'issue.created'; workspaceId: string; actorId: string; issue: Issue }
  | { type: 'issue.updated'; workspaceId: string; actorId: string; issue: Issue }
  | { type: 'issue.deleted'; workspaceId: string; actorId: string; issueId: string }
  | { type: 'comment.created'; workspaceId: string; actorId: string; comment: Comment }
  | { type: 'project.updated'; workspaceId: string; actorId: string; project: Project }

export async function publishWorkspaceEvent(event: WorkspaceEvent) {
  try {
    await redis.publish(WORKSPACE_EVENTS_CHANNEL, JSON.stringify(event))
  } catch {
    // Real-time delivery is best-effort; a Redis hiccup must not fail the mutation itself.
  }
}
