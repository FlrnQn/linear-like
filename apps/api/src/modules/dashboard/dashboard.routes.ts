import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import { getWorkspaceStats } from './dashboard.service'

const workspaceIdParamsSchema = z.object({ id: z.string().uuid() })

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get('/workspaces/:id/stats', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = workspaceIdParamsSchema.parse(request.params)

    await requireWorkspaceRole(request.user.sub, id, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])
    return getWorkspaceStats(id)
  })
}
