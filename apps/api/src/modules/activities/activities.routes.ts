import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { NotFoundError } from '../../lib/errors'
import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import { getWorkspaceIdForIssue } from '../issues/issues.service'
import { listActivitiesForIssue } from './activities.service'

const listActivitiesQuerySchema = z.object({ issueId: z.string().uuid() })

export const activitiesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/activities', { preHandler: [app.authenticate] }, async (request) => {
    const { issueId } = listActivitiesQuerySchema.parse(request.query)

    const workspaceId = await getWorkspaceIdForIssue(issueId)
    if (!workspaceId) throw new NotFoundError('Issue not found')
    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])

    return listActivitiesForIssue(issueId)
  })
}
