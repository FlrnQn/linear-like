import type { Issue, IssuePriority, IssueStatus } from '@lynx/types'

import { toPublicUser } from '../users/users.mapper'

interface UserRow {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: Date
}

interface LabelRow {
  id: string
  workspaceId: string
  name: string
  color: string
  createdAt: Date
}

interface ProjectSummaryRow {
  id: string
  name: string
  color: string | null
  icon: string | null
}

interface CycleSummaryRow {
  id: string
  name: string
  number: number
}

interface IssueRow {
  id: string
  teamId: string
  number: number
  title: string
  description: string | null
  status: IssueStatus
  priority: IssuePriority
  estimate: number | null
  dueDate: Date | null
  sortOrder: number
  projectId: string | null
  cycleId: string | null
  createdAt: Date
  updatedAt: Date
  team: { key: string }
  assignee: UserRow | null
  creator: UserRow
  issueLabels: { label: LabelRow }[]
  project: ProjectSummaryRow | null
  cycle: CycleSummaryRow | null
}

export function toPublicIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    teamId: row.teamId,
    identifier: `${row.team.key}-${row.number}`,
    number: row.number,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    estimate: row.estimate,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    sortOrder: row.sortOrder,
    projectId: row.projectId,
    cycleId: row.cycleId,
    assignee: row.assignee ? toPublicUser(row.assignee) : null,
    creator: toPublicUser(row.creator),
    labels: row.issueLabels.map(({ label }) => ({
      id: label.id,
      workspaceId: label.workspaceId,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt.toISOString(),
    })),
    project: row.project
      ? {
          id: row.project.id,
          name: row.project.name,
          color: row.project.color,
          icon: row.project.icon,
        }
      : null,
    cycle: row.cycle ? { id: row.cycle.id, name: row.cycle.name, number: row.cycle.number } : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
