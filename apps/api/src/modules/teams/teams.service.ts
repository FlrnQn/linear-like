import type { CreateTeamInput } from '@lynx/types'
import { and, eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { teamMembers, teams } from '../../db/schema'
import { ConflictError } from '../../lib/errors'

export async function createTeam(creatorId: string, input: CreateTeamInput) {
  const existing = await db.query.teams.findFirst({
    where: and(eq(teams.workspaceId, input.workspaceId), eq(teams.key, input.key)),
  })
  if (existing)
    throw new ConflictError(`A team with key "${input.key}" already exists in this workspace`)

  return db.transaction(async (tx) => {
    const [team] = await tx.insert(teams).values(input).returning()
    if (!team) throw new Error('Failed to create team')

    await tx.insert(teamMembers).values({ teamId: team.id, userId: creatorId })

    return team
  })
}

export async function listTeamsForWorkspace(workspaceId: string) {
  return db.query.teams.findMany({ where: eq(teams.workspaceId, workspaceId) })
}

export async function getTeamById(id: string) {
  return db.query.teams.findFirst({ where: eq(teams.id, id) })
}
