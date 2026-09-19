import type { FastifyPluginAsync } from 'fastify'

import { NotFoundError } from '../../lib/errors'
import { toPublicUser } from './users.mapper'
import { getUserById } from './users.service'

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/users/me', { preHandler: [app.authenticate] }, async (request) => {
    const user = await getUserById(request.user.sub)
    if (!user) throw new NotFoundError('User not found')
    return toPublicUser(user)
  })
}
