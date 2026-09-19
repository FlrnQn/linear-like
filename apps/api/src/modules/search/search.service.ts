import type { IssueSearchResult } from '@lynx/types'
import { and, eq, ilike } from 'drizzle-orm'

import { db } from '../../db/client'
import { issues, teams } from '../../db/schema'

export async function searchIssues(
  workspaceId: string,
  query: string,
): Promise<IssueSearchResult[]> {
  const rows = await db
    .select({
      id: issues.id,
      number: issues.number,
      title: issues.title,
      teamId: issues.teamId,
      teamKey: teams.key,
    })
    .from(issues)
    .innerJoin(teams, eq(issues.teamId, teams.id))
    .where(and(eq(teams.workspaceId, workspaceId), ilike(issues.title, `%${query}%`)))
    .limit(20)

  return rows.map((row) => ({
    id: row.id,
    identifier: `${row.teamKey}-${row.number}`,
    title: row.title,
    teamId: row.teamId,
  }))
}
