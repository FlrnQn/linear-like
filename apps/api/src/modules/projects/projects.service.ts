import type { CreateProjectInput, UpdateProjectInput } from '@lynx/types'
import { eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { projects } from '../../db/schema'
import { NotFoundError } from '../../lib/errors'

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

export async function updateProject(id: string, input: UpdateProjectInput) {
  const existing = await getProjectById(id)
  if (!existing) throw new NotFoundError('Project not found')

  const [updated] = await db.update(projects).set(input).where(eq(projects.id, id)).returning()
  if (!updated) throw new Error('Failed to update project')
  return updated
}
