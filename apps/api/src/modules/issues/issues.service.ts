import type { CreateIssueInput, PaginatedIssues, UpdateIssueInput } from '@lynx/types'
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm'

import { db } from '../../db/client'
import { activities, cycles, issueLabels, issues, projects, teams } from '../../db/schema'
import { NotFoundError } from '../../lib/errors'
import { publishWorkspaceEvent } from '../../websocket/events'
import { toPublicIssue } from './issues.mapper'

const issueRelations = {
  team: { columns: { key: true } },
  assignee: true,
  creator: true,
  issueLabels: { with: { label: true } },
  project: { columns: { id: true, name: true, color: true, icon: true } },
  cycle: { columns: { id: true, name: true, number: true } },
} as const

async function assertProjectBelongsToWorkspace(projectId: string | undefined, workspaceId: string) {
  if (!projectId) return
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
  if (!project || project.workspaceId !== workspaceId) {
    throw new NotFoundError('Project not found in this workspace')
  }
}

async function assertCycleBelongsToTeam(cycleId: string | undefined, teamId: string) {
  if (!cycleId) return
  const cycle = await db.query.cycles.findFirst({ where: eq(cycles.id, cycleId) })
  if (!cycle || cycle.teamId !== teamId) {
    throw new NotFoundError('Cycle not found for this team')
  }
}

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

export async function listRecentIssuesForWorkspace(workspaceId: string, limit: number) {
  const workspaceTeams = await db.query.teams.findMany({
    where: eq(teams.workspaceId, workspaceId),
    columns: { id: true },
  })
  const teamIds = workspaceTeams.map((team) => team.id)
  if (teamIds.length === 0) return []

  const rows = await db.query.issues.findMany({
    where: inArray(issues.teamId, teamIds),
    with: issueRelations,
    orderBy: [desc(issues.createdAt), desc(issues.id)],
    limit,
  })
  return rows.map(toPublicIssue)
}

interface IssueListFilters {
  status?: string
  assigneeId?: string
  cycleId?: string
  cursor?: string
  limit: number
}

interface IssueCursor {
  createdAt: Date
  id: string
}

// Opaque, URL-safe cursor over (createdAt, id) — see the index comment in
// db/schema/issues.ts for why both fields are needed, not createdAt alone.
function encodeCursor(cursor: IssueCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id }),
  ).toString('base64url')
}

function decodeCursor(raw: string): IssueCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      createdAt: string
      id: string
    }
    return { createdAt: new Date(parsed.createdAt), id: parsed.id }
  } catch {
    return null
  }
}

async function listIssuesWhere(
  scopeCondition: NonNullable<Parameters<typeof and>[0]>,
  filters: IssueListFilters,
): Promise<PaginatedIssues> {
  const conditions = [scopeCondition]
  if (filters.status) conditions.push(eq(issues.status, filters.status as never))
  if (filters.assigneeId) conditions.push(eq(issues.assigneeId, filters.assigneeId))
  if (filters.cycleId) conditions.push(eq(issues.cycleId, filters.cycleId))

  const cursor = filters.cursor ? decodeCursor(filters.cursor) : null
  if (cursor) {
    const cursorCondition = or(
      lt(issues.createdAt, cursor.createdAt),
      and(eq(issues.createdAt, cursor.createdAt), lt(issues.id, cursor.id)),
    )
    if (cursorCondition) conditions.push(cursorCondition)
  }

  // Fetch one extra row to know whether a next page exists without a
  // separate COUNT(*) query.
  const rows = await db.query.issues.findMany({
    where: and(...conditions),
    with: issueRelations,
    orderBy: [desc(issues.createdAt), desc(issues.id)],
    limit: filters.limit + 1,
  })

  const hasMore = rows.length > filters.limit
  const pageRows = hasMore ? rows.slice(0, filters.limit) : rows
  const lastRow = pageRows[pageRows.length - 1]

  return {
    items: pageRows.map(toPublicIssue),
    nextCursor:
      hasMore && lastRow ? encodeCursor({ createdAt: lastRow.createdAt, id: lastRow.id }) : null,
  }
}

export async function listIssuesForTeam(teamId: string, filters: IssueListFilters) {
  return listIssuesWhere(eq(issues.teamId, teamId), filters)
}

export async function listIssuesForProject(projectId: string, filters: IssueListFilters) {
  return listIssuesWhere(eq(issues.projectId, projectId), filters)
}

export async function createIssue(
  team: { id: string; workspaceId: string },
  creatorId: string,
  input: CreateIssueInput,
) {
  await assertProjectBelongsToWorkspace(input.projectId, team.workspaceId)
  await assertCycleBelongsToTeam(input.cycleId, team.id)

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
        projectId: input.projectId,
        cycleId: input.cycleId,
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

  await publishWorkspaceEvent({
    type: 'issue.created',
    workspaceId: team.workspaceId,
    actorId: creatorId,
    issue: created,
  })

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

  if (input.projectId) await assertProjectBelongsToWorkspace(input.projectId, workspaceId)
  if (input.cycleId) await assertCycleBelongsToTeam(input.cycleId, existing.teamId)

  await db.transaction(async (tx) => {
    const updates: Partial<typeof issues.$inferInsert> = {}
    if (input.title !== undefined) updates.title = input.title
    if (input.description !== undefined) updates.description = input.description
    if (input.status !== undefined) updates.status = input.status
    if (input.priority !== undefined) updates.priority = input.priority
    if (input.assigneeId !== undefined) updates.assigneeId = input.assigneeId
    if (input.projectId !== undefined) updates.projectId = input.projectId
    if (input.cycleId !== undefined) updates.cycleId = input.cycleId
    if (input.estimate !== undefined) updates.estimate = input.estimate
    if (input.dueDate !== undefined) updates.dueDate = input.dueDate
    if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder

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

  await publishWorkspaceEvent({
    type: 'issue.updated',
    workspaceId,
    actorId,
    issue: updated,
  })

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

  await publishWorkspaceEvent({
    type: 'issue.deleted',
    workspaceId,
    actorId,
    issueId,
  })
}
