import { asc, eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { activities } from '../../db/schema'
import { toPublicActivity } from './activities.mapper'

export async function listActivitiesForIssue(issueId: string) {
  const rows = await db.query.activities.findMany({
    where: eq(activities.issueId, issueId),
    with: { actor: true },
    orderBy: [asc(activities.createdAt)],
  })
  return rows.map(toPublicActivity)
}
