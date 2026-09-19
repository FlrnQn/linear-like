import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import { searchIssues } from './search.service'

const searchQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  q: z.string().trim().min(1).max(200),
})

export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get('/search', { preHandler: [app.authenticate] }, async (request) => {
    const { workspaceId, q } = searchQuerySchema.parse(request.query)

    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])
    return searchIssues(workspaceId, q)
  })
}
