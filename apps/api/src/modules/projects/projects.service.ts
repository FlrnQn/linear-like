import type { CreateProjectInput, Project, UpdateProjectInput } from '@lynx/types'
import { eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { projects } from '../../db/schema'
import { NotFoundError } from '../../lib/errors'
import { publishWorkspaceEvent } from '../../websocket/events'

function toPublicProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    status: row.status,
    startDate: row.startDate ? row.startDate.toISOString() : null,
    targetDate: row.targetDate ? row.targetDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function createProject(input: CreateProjectInput) {
  const [project] = await db.insert(projects).values(input).returning()
  if (!project) throw new Error('Failed to create project')
  return project
}

export async function listProjectsForWorkspace(workspaceId: string) {
  return db.query.projects.findMany({ where: eq(projects.workspaceId, workspaceId) })
}

export async function getProjectById(id: string) {
  return db.query.projects.findFirst({ where: eq(projects.id, id) })
}

export async function updateProject(id: string, actorId: string, input: UpdateProjectInput) {
  const existing = await getProjectById(id)
  if (!existing) throw new NotFoundError('Project not found')

  const [updated] = await db.update(projects).set(input).where(eq(projects.id, id)).returning()
  if (!updated) throw new Error('Failed to update project')

  await publishWorkspaceEvent({
    type: 'project.updated',
    workspaceId: updated.workspaceId,
    actorId,
    project: toPublicProject(updated),
  })

  return updated
}
