import type { IssueStatus } from './enums'
import type { Issue } from './issues'

export interface WorkspaceStats {
  totalIssues: number
  issuesByStatus: Record<IssueStatus, number>
  projectCount: number
  teamCount: number
  recentIssues: Issue[]
  activityByDay: { date: string; count: number }[]
}
