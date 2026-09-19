import { createIssueSchema, ISSUE_STATUSES, updateIssueSchema } from '@lynx/types'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { NotFoundError } from '../../lib/errors'
import { requireWorkspaceRole } from '../../middleware/require-workspace-role'
import { getTeamById } from '../teams/teams.service'
import {
  createIssue,
  deleteIssue,
  getIssueById,
  getWorkspaceIdForIssue,
  listIssuesForTeam,
  updateIssue,
} from './issues.service'

const listIssuesQuerySchema = z.object({
  teamId: z.string().uuid(),
  status: z.enum(ISSUE_STATUSES).optional(),
  assigneeId: z.string().uuid().optional(),
  cycleId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

const issueIdParamsSchema = z.object({ id: z.string().uuid() })

export const issuesRoutes: FastifyPluginAsync = async (app) => {
  app.post('/issues', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createIssueSchema.parse(request.body)

    const team = await getTeamById(body.teamId)
    if (!team) throw new NotFoundError('Team not found')

    await requireWorkspaceRole(request.user.sub, team.workspaceId, ['OWNER', 'ADMIN', 'MEMBER'])
    const issue = await createIssue(team, request.user.sub, body)

    return reply.code(201).send(issue)
  })

  app.get('/issues', { preHandler: [app.authenticate] }, async (request) => {
    const query = listIssuesQuerySchema.parse(request.query)

    const team = await getTeamById(query.teamId)
    if (!team) throw new NotFoundError('Team not found')

    await requireWorkspaceRole(request.user.sub, team.workspaceId, [
      'OWNER',
      'ADMIN',
      'MEMBER',
      'GUEST',
    ])
    return listIssuesForTeam(query.teamId, query)
  })

  app.get('/issues/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = issueIdParamsSchema.parse(request.params)

    const workspaceId = await getWorkspaceIdForIssue(id)
    if (!workspaceId) throw new NotFoundError('Issue not found')
    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])

    const issue = await getIssueById(id)
    if (!issue) throw new NotFoundError('Issue not found')
    return issue
  })

  app.patch('/issues/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = issueIdParamsSchema.parse(request.params)
    const body = updateIssueSchema.parse(request.body)

    const workspaceId = await getWorkspaceIdForIssue(id)
    if (!workspaceId) throw new NotFoundError('Issue not found')
    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER'])

    return updateIssue(id, request.user.sub, workspaceId, body)
  })

  app.delete('/issues/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = issueIdParamsSchema.parse(request.params)

    const workspaceId = await getWorkspaceIdForIssue(id)
    if (!workspaceId) throw new NotFoundError('Issue not found')
    await requireWorkspaceRole(request.user.sub, workspaceId, ['OWNER', 'ADMIN', 'MEMBER'])

    await deleteIssue(id, request.user.sub, workspaceId)
    return reply.code(204).send()
  })
}
