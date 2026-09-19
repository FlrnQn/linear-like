import type { Activity } from '@lynx/types'

import { EmptyState } from '@/components/empty-state'
import { PRIORITY_LABELS } from '@/features/issues/status-priority'
import { STATUS_LABELS } from '@/features/issues/status-priority'

function describeActivity(activity: Activity): string {
  const metadata = activity.metadata ?? {}

  switch (activity.type) {
    case 'ISSUE_CREATED':
      return 'created this issue'
    case 'ISSUE_STATUS_CHANGED': {
      const from =
        STATUS_LABELS[metadata.from as keyof typeof STATUS_LABELS] ?? String(metadata.from)
      const to = STATUS_LABELS[metadata.to as keyof typeof STATUS_LABELS] ?? String(metadata.to)
      return `changed status from ${from} to ${to}`
    }
    case 'ISSUE_PRIORITY_CHANGED': {
      const from =
        PRIORITY_LABELS[metadata.from as keyof typeof PRIORITY_LABELS] ?? String(metadata.from)
      const to = PRIORITY_LABELS[metadata.to as keyof typeof PRIORITY_LABELS] ?? String(metadata.to)
      return `changed priority from ${from} to ${to}`
    }
    case 'ISSUE_ASSIGNED':
      return metadata.assigneeId ? 'assigned this issue' : 'unassigned this issue'
    case 'ISSUE_LABELED':
      return 'added labels'
    case 'ISSUE_UNLABELED':
      return 'removed labels'
    case 'ISSUE_DELETED':
      return 'deleted this issue'
    case 'COMMENT_CREATED':
      return 'left a comment'
    case 'PROJECT_UPDATED':
      return 'updated the project'
    case 'CYCLE_UPDATED':
      return 'updated the cycle'
    default:
      return activity.type
  }
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <EmptyState title="No activity yet." compact />
  }

  return (
    <ul className="flex flex-col gap-2">
      {activities.map((activity) => (
        <li key={activity.id} className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">{activity.actor.name}</span>{' '}
          {describeActivity(activity)}
        </li>
      ))}
    </ul>
  )
}
