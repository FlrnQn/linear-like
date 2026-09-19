import type { IssuePriority, IssueStatus } from '@lynx/types'
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from '@lynx/types'

export const STATUS_LABEL_KEYS: Record<IssueStatus, string> = {
  BACKLOG: 'issue.status.backlog',
  TODO: 'issue.status.todo',
  IN_PROGRESS: 'issue.status.inProgress',
  IN_REVIEW: 'issue.status.inReview',
  DONE: 'issue.status.done',
  CANCELED: 'issue.status.canceled',
}

export const STATUS_DOT_COLORS: Record<IssueStatus, string> = {
  BACKLOG: 'bg-slate-400',
  TODO: 'bg-slate-300',
  IN_PROGRESS: 'bg-amber-400',
  IN_REVIEW: 'bg-violet-400',
  DONE: 'bg-emerald-500',
  CANCELED: 'bg-red-400',
}

export const PRIORITY_LABEL_KEYS: Record<IssuePriority, string> = {
  NO_PRIORITY: 'issue.priority.none',
  LOW: 'issue.priority.low',
  MEDIUM: 'issue.priority.medium',
  HIGH: 'issue.priority.high',
  URGENT: 'issue.priority.urgent',
}

export { ISSUE_PRIORITIES, ISSUE_STATUSES }
