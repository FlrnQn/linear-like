import { createCommentSchema } from '@lynx/types'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { NotFoundError } from '../../lib/errors'
import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import { getWorkspaceIdForIssue } from '../issues/issues.service'
import { createComment, listCommentsForIssue } from './comments.service'

const listCommentsQuerySchema = z.object({ issueId: z.string().uuid() })

export const commentsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/comments', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createCommentSchema.parse(request.body)

    const workspaceId = await getWorkspaceIdForIssue(body.issueId)
    if (!workspaceId) throw new NotFoundError('Issue not found')
    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])

    const comment = await createComment(workspaceId, request.user.sub, body)
    return reply.code(201).send(comment)
  })

  app.get('/comments', { preHandler: [app.authenticate] }, async (request) => {
    const { issueId } = listCommentsQuerySchema.parse(request.query)

    const workspaceId = await getWorkspaceIdForIssue(issueId)
    if (!workspaceId) throw new NotFoundError('Issue not found')
    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])

    return listCommentsForIssue(issueId)
  })
}
