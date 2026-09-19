import type { CreateCycleInput } from '@lynx/types'
import { desc, eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { cycles } from '../../db/schema'

export async function createCycle(input: CreateCycleInput) {
  return db.transaction(async (tx) => {
    const [latest] = await tx
      .select({ number: cycles.number })
      .from(cycles)
      .where(eq(cycles.teamId, input.teamId))
      .orderBy(desc(cycles.number))
      .limit(1)

    const nextNumber = (latest?.number ?? 0) + 1

    const [cycle] = await tx
      .insert(cycles)
      .values({
        teamId: input.teamId,
        name: input.name,
        number: nextNumber,
        startDate: input.startDate,
        endDate: input.endDate,
      })
      .returning()
    if (!cycle) throw new Error('Failed to create cycle')
    return cycle
  })
}

export async function listCyclesForTeam(teamId: string) {
  return db.query.cycles.findMany({
    where: eq(cycles.teamId, teamId),
    orderBy: [desc(cycles.number)],
  })
}

export async function getCycleById(id: string) {
  return db.query.cycles.findFirst({ where: eq(cycles.id, id) })
}
