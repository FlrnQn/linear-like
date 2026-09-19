import { createWorkspaceSchema } from '@lynx/types'
import type { FastifyPluginAsync } from 'fastify'

import { ConflictError, NotFoundError } from '../../lib/errors'
import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import { workspaceIdParamsSchema } from './workspaces.schemas'
import {
  createWorkspaceForUser,
  findWorkspaceBySlug,
  getWorkspaceForUser,
  listMembersForWorkspace,
  listWorkspacesForUser,
} from './workspaces.service'

export const workspacesRoutes: FastifyPluginAsync = async (app) => {
  app.post('/workspaces', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createWorkspaceSchema.parse(request.body)

    const existing = await findWorkspaceBySlug(body.slug)
    if (existing) throw new ConflictError('This workspace slug is already taken')

    const workspace = await createWorkspaceForUser(request.user.sub, body)
    return reply.code(201).send(workspace)
  })

  app.get('/workspaces', { preHandler: [app.authenticate] }, async (request) => {
    return listWorkspacesForUser(request.user.sub)
  })

  app.get('/workspaces/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = workspaceIdParamsSchema.parse(request.params)

    const workspace = await getWorkspaceForUser(request.user.sub, id)
    if (!workspace) throw new NotFoundError('Workspace not found')

    return workspace
  })

  app.get('/workspaces/:id/members', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = workspaceIdParamsSchema.parse(request.params)

    await requireWorkspaceRole(request.user.sub, id, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])
    return listMembersForWorkspace(id)
  })
}
