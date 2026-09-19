import type { IssuePriority, IssueStatus } from '@lynx/types'
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from '@lynx/types'

export const STATUS_LABELS: Record<IssueStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELED: 'Canceled',
}

export const STATUS_DOT_COLORS: Record<IssueStatus, string> = {
  BACKLOG: 'bg-slate-400',
  TODO: 'bg-slate-300',
  IN_PROGRESS: 'bg-amber-400',
  IN_REVIEW: 'bg-violet-400',
  DONE: 'bg-emerald-500',
  CANCELED: 'bg-red-400',
}

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  NO_PRIORITY: 'No priority',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export { ISSUE_PRIORITIES, ISSUE_STATUSES }
