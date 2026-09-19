import type { WorkspaceStats } from '@lynx/types'

import { IssuesActivityChart } from './issues-activity-chart'
import { StatTile } from './stat-tile'

export function DashboardPanel({ stats }: { stats: WorkspaceStats }) {
  const inProgress = stats.issuesByStatus.IN_PROGRESS + stats.issuesByStatus.IN_REVIEW

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total issues" value={stats.totalIssues} />
        <StatTile label="In progress" value={inProgress} />
        <StatTile label="Completed" value={stats.issuesByStatus.DONE} />
        <StatTile label="Projects" value={stats.projectCount} />
      </div>

      <IssuesActivityChart data={stats.activityByDay} />
    </section>
  )
}
