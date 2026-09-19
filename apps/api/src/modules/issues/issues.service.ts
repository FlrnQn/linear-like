import type { CreateIssueInput, UpdateIssueInput } from '@lynx/types'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'

import { db } from '../../db/client'
import { activities, issueLabels, issues, teams } from '../../db/schema'
import { NotFoundError } from '../../lib/errors'
import { toPublicIssue } from './issues.mapper'

const issueRelations = {
  team: { columns: { key: true } },
  assignee: true,
  creator: true,
  issueLabels: { with: { label: true } },
} as const

export async function getWorkspaceIdForIssue(issueId: string) {
  const row = await db.query.issues.findFirst({
    where: eq(issues.id, issueId),
    with: { team: { columns: { workspaceId: true } } },
  })
  return row?.team.workspaceId ?? null
}

export async function getIssueById(id: string) {
  const row = await db.query.issues.findFirst({
    where: eq(issues.id, id),
    with: issueRelations,
  })
  return row ? toPublicIssue(row) : null
}

export async function listIssuesForTeam(
  teamId: string,
  filters: { status?: string; assigneeId?: string; limit: number; offset: number },
) {
  const conditions = [eq(issues.teamId, teamId)]
  if (filters.status) conditions.push(eq(issues.status, filters.status as never))
  if (filters.assigneeId) conditions.push(eq(issues.assigneeId, filters.assigneeId))

  const rows = await db.query.issues.findMany({
    where: and(...conditions),
    with: issueRelations,
    orderBy: [desc(issues.createdAt)],
    limit: filters.limit,
    offset: filters.offset,
  })

  return rows.map(toPublicIssue)
}

export async function createIssue(
  team: { id: string; workspaceId: string },
  creatorId: string,
  input: CreateIssueInput,
) {
  const issueId = await db.transaction(async (tx) => {
    const [updatedTeam] = await tx
      .update(teams)
      .set({ issueCount: sql`${teams.issueCount} + 1` })
      .where(eq(teams.id, team.id))
      .returning({ issueCount: teams.issueCount })
    if (!updatedTeam) throw new Error('Failed to increment team issue counter')

    const [issue] = await tx
      .insert(issues)
      .values({
        teamId: team.id,
        number: updatedTeam.issueCount,
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        creatorId,
        estimate: input.estimate,
        dueDate: input.dueDate,
      })
      .returning()
    if (!issue) throw new Error('Failed to create issue')

    if (input.labelIds && input.labelIds.length > 0) {
      await tx
        .insert(issueLabels)
        .values(input.labelIds.map((labelId) => ({ issueId: issue.id, labelId })))
    }

    await tx.insert(activities).values({
      workspaceId: team.workspaceId,
      issueId: issue.id,
      actorId: creatorId,
      type: 'ISSUE_CREATED',
      metadata: { title: issue.title },
    })

    return issue.id
  })

  const created = await getIssueById(issueId)
  if (!created) throw new Error('Failed to load created issue')
  return created
}

export async function updateIssue(
  issueId: string,
  actorId: string,
  workspaceId: string,
  input: UpdateIssueInput,
) {
  const existing = await db.query.issues.findFirst({ where: eq(issues.id, issueId) })
  if (!existing) throw new NotFoundError('Issue not found')

  await db.transaction(async (tx) => {
    const updates: Partial<typeof issues.$inferInsert> = {}
    if (input.title !== undefined) updates.title = input.title
    if (input.description !== undefined) updates.description = input.description
    if (input.status !== undefined) updates.status = input.status
    if (input.priority !== undefined) updates.priority = input.priority
    if (input.assigneeId !== undefined) updates.assigneeId = input.assigneeId
    if (input.estimate !== undefined) updates.estimate = input.estimate
    if (input.dueDate !== undefined) updates.dueDate = input.dueDate

    if (Object.keys(updates).length > 0) {
      await tx.update(issues).set(updates).where(eq(issues.id, issueId))
    }

    const activityRows: (typeof activities.$inferInsert)[] = []

    if (input.status !== undefined && input.status !== existing.status) {
      activityRows.push({
        workspaceId,
        issueId,
        actorId,
        type: 'ISSUE_STATUS_CHANGED',
        metadata: { from: existing.status, to: input.status },
      })
    }
    if (input.priority !== undefined && input.priority !== existing.priority) {
      activityRows.push({
        workspaceId,
        issueId,
        actorId,
        type: 'ISSUE_PRIORITY_CHANGED',
        metadata: { from: existing.priority, to: input.priority },
      })
    }
    if (input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId) {
      activityRows.push({
        workspaceId,
        issueId,
        actorId,
        type: 'ISSUE_ASSIGNED',
        metadata: { assigneeId: input.assigneeId },
      })
    }

    if (input.labelIds !== undefined) {
      const currentLabels = await tx.query.issueLabels.findMany({
        where: eq(issueLabels.issueId, issueId),
      })
      const currentIds = new Set(currentLabels.map((l) => l.labelId))
      const nextIds = new Set(input.labelIds)

      const toAdd = input.labelIds.filter((id) => !currentIds.has(id))
      const toRemove = [...currentIds].filter((id) => !nextIds.has(id))

      if (toRemove.length > 0) {
        await tx
          .delete(issueLabels)
          .where(and(eq(issueLabels.issueId, issueId), inArray(issueLabels.labelId, toRemove)))
      }
      if (toAdd.length > 0) {
        await tx.insert(issueLabels).values(toAdd.map((labelId) => ({ issueId, labelId })))
      }
      if (toAdd.length > 0) {
        activityRows.push({
          workspaceId,
          issueId,
          actorId,
          type: 'ISSUE_LABELED',
          metadata: { labelIds: toAdd },
        })
      }
      if (toRemove.length > 0) {
        activityRows.push({
          workspaceId,
          issueId,
          actorId,
          type: 'ISSUE_UNLABELED',
          metadata: { labelIds: toRemove },
        })
      }
    }

    if (activityRows.length > 0) {
      await tx.insert(activities).values(activityRows)
    }
  })

  const updated = await getIssueById(issueId)
  if (!updated) throw new Error('Failed to load updated issue')
  return updated
}

export async function deleteIssue(issueId: string, actorId: string, workspaceId: string) {
  const existing = await db.query.issues.findFirst({
    where: eq(issues.id, issueId),
    with: { team: { columns: { key: true } } },
  })
  if (!existing) throw new NotFoundError('Issue not found')

  await db.transaction(async (tx) => {
    await tx.insert(activities).values({
      workspaceId,
      issueId,
      actorId,
      type: 'ISSUE_DELETED',
      metadata: { identifier: `${existing.team.key}-${existing.number}`, title: existing.title },
    })
    await tx.delete(issues).where(eq(issues.id, issueId))
  })
}
