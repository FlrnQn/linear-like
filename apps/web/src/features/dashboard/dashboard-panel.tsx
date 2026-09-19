import type { WorkspaceStats } from '@lynx/types'
import { useTranslation } from 'react-i18next'

import { IssuesActivityChart } from './issues-activity-chart'
import { StatTile } from './stat-tile'

export function DashboardPanel({ stats }: { stats: WorkspaceStats }) {
  const { t } = useTranslation()
  const inProgress = stats.issuesByStatus.IN_PROGRESS + stats.issuesByStatus.IN_REVIEW

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t('dashboard.totalIssues')} value={stats.totalIssues} />
        <StatTile label={t('dashboard.inProgress')} value={inProgress} />
        <StatTile label={t('dashboard.completed')} value={stats.issuesByStatus.DONE} />
        <StatTile label={t('dashboard.projects')} value={stats.projectCount} />
      </div>

      <IssuesActivityChart data={stats.activityByDay} />
    </section>
  )
}
