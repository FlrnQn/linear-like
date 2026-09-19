export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'] as const
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]

export const ISSUE_STATUSES = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'CANCELED',
] as const
export type IssueStatus = (typeof ISSUE_STATUSES)[number]

export const ISSUE_PRIORITIES = ['NO_PRIORITY', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number]

export const PROJECT_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const ACTIVITY_TYPES = [
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
] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]
