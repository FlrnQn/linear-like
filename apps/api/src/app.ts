import Fastify, { type FastifyError } from 'fastify'
import { ZodError } from 'zod'

import { env } from './env'
import { activitiesRoutes } from './modules/activities/activities.routes'
import { authRoutes } from './modules/auth/auth.routes'
import { commentsRoutes } from './modules/comments/comments.routes'
import { cyclesRoutes } from './modules/cycles/cycles.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { healthRoutes } from './modules/health/health.routes'
import { issuesRoutes } from './modules/issues/issues.routes'
import { labelsRoutes } from './modules/labels/labels.routes'
import { projectsRoutes } from './modules/projects/projects.routes'
import { searchRoutes } from './modules/search/search.routes'
import { teamsRoutes } from './modules/teams/teams.routes'
import { usersRoutes } from './modules/users/users.routes'
import { workspacesRoutes } from './modules/workspaces/workspaces.routes'
import { registerCookie } from './plugins/cookie'
import { registerCors } from './plugins/cors'
import { registerJwt } from './plugins/jwt'
import { registerSensible } from './plugins/sensible'
import { registerWebsocket } from './websocket/websocket.plugin'

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
        : env.NODE_ENV === 'test'
          ? false
          : true,
  })

  await registerCors(app)
  await registerSensible(app)
  await registerCookie(app)
  await registerJwt(app)
  await registerWebsocket(app)

  app.setErrorHandler((error: FastifyError | ZodError, _request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        error: {
          message: 'Validation error',
          statusCode: 400,
          issues: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      })
      return
    }

    const statusCode = error.statusCode ?? 500
    reply.status(statusCode).send({
      error: {
        message: error.message,
        statusCode,
      },
    })
  })

  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(usersRoutes)
  await app.register(workspacesRoutes)
  await app.register(teamsRoutes)
  await app.register(labelsRoutes)
  await app.register(projectsRoutes)
  await app.register(cyclesRoutes)
  await app.register(issuesRoutes)
  await app.register(commentsRoutes)
  await app.register(activitiesRoutes)
  await app.register(searchRoutes)
  await app.register(dashboardRoutes)

  return app
}
