import { createCycleSchema } from '@lynx/types'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { NotFoundError } from '../../lib/errors'
import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import { getTeamById } from '../teams/teams.service'
import { createCycle, listCyclesForTeam } from './cycles.service'

const listCyclesQuerySchema = z.object({ teamId: z.string().uuid() })

export const cyclesRoutes: FastifyPluginAsync = async (app) => {
  app.post('/cycles', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createCycleSchema.parse(request.body)

    const team = await getTeamById(body.teamId)
    if (!team) throw new NotFoundError('Team not found')
    await requireWorkspaceRole(request.user.sub, team.workspaceId, ['OWNER', 'ADMIN'])

    const cycle = await createCycle(body)
    return reply.code(201).send(cycle)
  })

  app.get('/cycles', { preHandler: [app.authenticate] }, async (request) => {
    const { teamId } = listCyclesQuerySchema.parse(request.query)

    const team = await getTeamById(teamId)
    if (!team) throw new NotFoundError('Team not found')
    await requireWorkspaceRole(request.user.sub, team.workspaceId, [
      'OWNER',
      'ADMIN',
      'MEMBER',
      'GUEST',
    ])

    return listCyclesForTeam(teamId)
  })
}
