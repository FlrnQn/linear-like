import { pgEnum } from 'drizzle-orm/pg-core'

export const workspaceRole = pgEnum('workspace_role', ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])

export const issueStatus = pgEnum('issue_status', [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'CANCELED',
])

export const issuePriority = pgEnum('issue_priority', [
  'NO_PRIORITY',
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
])

export const projectStatus = pgEnum('project_status', [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
])

export const activityType = pgEnum('activity_type', [
  'ISSUE_CREATED',
  'ISSUE_STATUS_CHANGED',
  'ISSUE_PRIORITY_CHANGED',
  'ISSUE_ASSIGNED',
  'ISSUE_LABELED',
  'ISSUE_UNLABELED',
  'ISSUE_DELETED',
  'COMMENT_CREATED',
  'PROJECT_UPDATED',
  'CYCLE_UPDATED',
])
