import type { Activity } from '@lynx/types'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state'
import { PRIORITY_LABEL_KEYS, STATUS_LABEL_KEYS } from '@/features/issues/status-priority'

function describeActivity(activity: Activity, t: TFunction): string {
  const metadata = activity.metadata ?? {}

  switch (activity.type) {
    case 'ISSUE_CREATED':
      return t('activity.createdIssue')
    case 'ISSUE_STATUS_CHANGED': {
      const fromKey = STATUS_LABEL_KEYS[metadata.from as keyof typeof STATUS_LABEL_KEYS]
      const toKey = STATUS_LABEL_KEYS[metadata.to as keyof typeof STATUS_LABEL_KEYS]
      const from = fromKey ? t(fromKey) : String(metadata.from)
      const to = toKey ? t(toKey) : String(metadata.to)
      return t('activity.statusChanged', { from, to })
    }
    case 'ISSUE_PRIORITY_CHANGED': {
      const fromKey = PRIORITY_LABEL_KEYS[metadata.from as keyof typeof PRIORITY_LABEL_KEYS]
      const toKey = PRIORITY_LABEL_KEYS[metadata.to as keyof typeof PRIORITY_LABEL_KEYS]
      const from = fromKey ? t(fromKey) : String(metadata.from)
      const to = toKey ? t(toKey) : String(metadata.to)
      return t('activity.priorityChanged', { from, to })
    }
    case 'ISSUE_ASSIGNED':
      return metadata.assigneeId ? t('activity.assigned') : t('activity.unassigned')
    case 'ISSUE_LABELED':
      return t('activity.labelsAdded')
    case 'ISSUE_UNLABELED':
      return t('activity.labelsRemoved')
    case 'ISSUE_DELETED':
      return t('activity.issueDeleted')
    case 'COMMENT_CREATED':
      return t('activity.commentLeft')
    case 'PROJECT_UPDATED':
      return t('activity.projectUpdated')
    case 'CYCLE_UPDATED':
      return t('activity.cycleUpdated')
    default:
      return activity.type
  }
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  const { t } = useTranslation()

  if (activities.length === 0) {
    return <EmptyState title={t('activity.empty')} compact />
  }

  return (
    <ul className="flex flex-col gap-2">
      {activities.map((activity) => (
        <li key={activity.id} className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">{activity.actor.name}</span>{' '}
          {describeActivity(activity, t)}
        </li>
      ))}
    </ul>
  )
}
