import {
  ACTIVITY_TYPES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  PROJECT_STATUSES,
  WORKSPACE_ROLES,
} from '@lynx/types'
import { pgEnum } from 'drizzle-orm/pg-core'

export const workspaceRole = pgEnum('workspace_role', WORKSPACE_ROLES)
export const issueStatus = pgEnum('issue_status', ISSUE_STATUSES)
export const issuePriority = pgEnum('issue_priority', ISSUE_PRIORITIES)
export const projectStatus = pgEnum('project_status', PROJECT_STATUSES)
export const activityType = pgEnum('activity_type', ACTIVITY_TYPES)
