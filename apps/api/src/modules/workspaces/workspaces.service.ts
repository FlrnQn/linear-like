import type { CreateWorkspaceInput } from '@lynx/types'
import { and, eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { workspaceMembers, workspaces } from '../../db/schema'

export async function findWorkspaceBySlug(slug: string) {
  return db.query.workspaces.findFirst({ where: eq(workspaces.slug, slug) })
}

export async function createWorkspaceForUser(userId: string, input: CreateWorkspaceInput) {
  return db.transaction(async (tx) => {
    const [workspace] = await tx.insert(workspaces).values(input).returning()
    if (!workspace) throw new Error('Failed to create workspace')

    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: 'OWNER',
    })

    return workspace
  })
}

export async function listWorkspacesForUser(userId: string) {
  const memberships = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.userId, userId),
    with: { workspace: true },
  })
  return memberships.map((membership) => membership.workspace)
}

export async function getWorkspaceForUser(userId: string, workspaceId: string) {
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)),
    with: { workspace: true },
  })
  return membership?.workspace ?? null
}

export async function listMembersForWorkspace(workspaceId: string) {
  const memberships = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.workspaceId, workspaceId),
    with: { user: true },
  })

  return memberships.map((membership) => ({
    userId: membership.user.id,
    name: membership.user.name,
    email: membership.user.email,
    avatarUrl: membership.user.avatarUrl,
    role: membership.role,
  }))
}
