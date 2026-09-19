import { and, eq } from 'drizzle-orm'

import { db } from '../db/client'
import { workspaceMembers } from '../db/schema'
import { ForbiddenError } from '../lib/errors'

type WorkspaceRoleValue = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'

export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  allowedRoles: WorkspaceRoleValue[],
) {
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)),
  })

  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new ForbiddenError('You do not have permission to perform this action in this workspace')
  }

  return membership
}
