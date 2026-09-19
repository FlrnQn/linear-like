import type { WorkspaceStats } from '@lynx/types'
import { ISSUE_STATUSES } from '@lynx/types'
import { and, count, eq, gte, sql } from 'drizzle-orm'

import { db } from '../../db/client'
import { issues, projects, teams } from '../../db/schema'
import { listRecentIssuesForWorkspace } from '../issues/issues.service'

const ACTIVITY_WINDOW_DAYS = 30
const RECENT_ISSUES_LIMIT = 8

// Grouped and formatted in Postgres (session timezone: UTC — see docker-compose)
// so the result is a plain "YYYY-MM-DD" string. Letting node-postgres parse a
// `::date` value instead hands back a JS Date reinterpreted at LOCAL-timezone
// midnight, which silently shifts the calendar day across the UTC boundary
// once serialized to ISO and re-parsed by a browser in a different timezone.
const dayExpr = sql<string>`to_char(date_trunc('day', ${issues.createdAt}), 'YYYY-MM-DD')`

function last30UtcDays(): string[] {
  const today = new Date()
  return Array.from({ length: ACTIVITY_WINDOW_DAYS }, (_, i) => {
    const offset = ACTIVITY_WINDOW_DAYS - 1 - i
    const day = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset),
    )
    return day.toISOString().slice(0, 10)
  })
}

export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
  const days = last30UtcDays()
  const windowStart = new Date(`${days[0]}T00:00:00.000Z`)

  const [[totalRow], statusRows, [projectCountRow], [teamCountRow], activityRows, recentIssues] =
    await Promise.all([
      db
        .select({ total: count() })
        .from(issues)
        .innerJoin(teams, eq(teams.id, issues.teamId))
        .where(eq(teams.workspaceId, workspaceId)),
      db
        .select({ status: issues.status, total: count() })
        .from(issues)
        .innerJoin(teams, eq(teams.id, issues.teamId))
        .where(eq(teams.workspaceId, workspaceId))
        .groupBy(issues.status),
      db.select({ total: count() }).from(projects).where(eq(projects.workspaceId, workspaceId)),
      db.select({ total: count() }).from(teams).where(eq(teams.workspaceId, workspaceId)),
      db
        .select({ day: dayExpr, total: count() })
        .from(issues)
        .innerJoin(teams, eq(teams.id, issues.teamId))
        .where(and(eq(teams.workspaceId, workspaceId), gte(issues.createdAt, windowStart)))
        .groupBy(dayExpr)
        .orderBy(dayExpr),
      listRecentIssuesForWorkspace(workspaceId, RECENT_ISSUES_LIMIT),
    ])

  const issuesByStatus = Object.fromEntries(
    ISSUE_STATUSES.map((status) => [status, 0]),
  ) as WorkspaceStats['issuesByStatus']
  for (const row of statusRows) issuesByStatus[row.status] = row.total

  const countsByDay = new Map(activityRows.map((row) => [row.day, row.total]))

  return {
    totalIssues: totalRow?.total ?? 0,
    issuesByStatus,
    projectCount: projectCountRow?.total ?? 0,
    teamCount: teamCountRow?.total ?? 0,
    recentIssues,
    activityByDay: days.map((date) => ({ date, count: countsByDay.get(date) ?? 0 })),
  }
}
