import { createLabelSchema } from '@lynx/types'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import { createLabel, listLabelsForWorkspace } from './labels.service'

const listLabelsQuerySchema = z.object({ workspaceId: z.string().uuid() })

export const labelsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/labels', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createLabelSchema.parse(request.body)

    await requireWorkspaceRole(request.user.sub, body.workspaceId, ['OWNER', 'ADMIN', 'MEMBER'])
    const label = await createLabel(body)

    return reply.code(201).send(label)
  })

  app.get('/labels', { preHandler: [app.authenticate] }, async (request) => {
    const { workspaceId } = listLabelsQuerySchema.parse(request.query)

    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])
    return listLabelsForWorkspace(workspaceId)
  })
}
