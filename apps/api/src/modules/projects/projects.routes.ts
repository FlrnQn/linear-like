import { createProjectSchema, updateProjectSchema } from '@lynx/types'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { NotFoundError } from '../../lib/errors'
import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import {
  createProject,
  getProjectById,
  listProjectsForWorkspace,
  updateProject,
} from './projects.service'

const listProjectsQuerySchema = z.object({ workspaceId: z.string().uuid() })
const projectIdParamsSchema = z.object({ id: z.string().uuid() })

export const projectsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/projects', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createProjectSchema.parse(request.body)

    await requireWorkspaceRole(request.user.sub, body.workspaceId, ['OWNER', 'ADMIN'])
    const project = await createProject(body)

    return reply.code(201).send(project)
  })

  app.get('/projects', { preHandler: [app.authenticate] }, async (request) => {
    const { workspaceId } = listProjectsQuerySchema.parse(request.query)

    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])
    return listProjectsForWorkspace(workspaceId)
  })

  app.get('/projects/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = projectIdParamsSchema.parse(request.params)

    const project = await getProjectById(id)
    if (!project) throw new NotFoundError('Project not found')
    await requireWorkspaceRole(request.user.sub, project.workspaceId, [
      'OWNER',
      'ADMIN',
      'MEMBER',
      'GUEST',
    ])

    return project
  })

  app.patch('/projects/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = projectIdParamsSchema.parse(request.params)
    const body = updateProjectSchema.parse(request.body)

    const project = await getProjectById(id)
    if (!project) throw new NotFoundError('Project not found')
    await requireWorkspaceRole(request.user.sub, project.workspaceId, ['OWNER', 'ADMIN', 'MEMBER'])

    return updateProject(id, request.user.sub, body)
  })
}
