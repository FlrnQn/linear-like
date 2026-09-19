import { createTeamSchema } from '@lynx/types'
import type { FastifyPluginAsync } from 'fastify'

import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import { listTeamsQuerySchema } from './teams.schemas'
import { createTeam, listTeamsForWorkspace } from './teams.service'

export const teamsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/teams', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createTeamSchema.parse(request.body)

    await requireWorkspaceRole(request.user.sub, body.workspaceId, ['OWNER', 'ADMIN'])
    const team = await createTeam(request.user.sub, body)

    return reply.code(201).send(team)
  })

  app.get('/teams', { preHandler: [app.authenticate] }, async (request) => {
    const { workspaceId } = listTeamsQuerySchema.parse(request.query)

    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])
    return listTeamsForWorkspace(workspaceId)
  })
}
