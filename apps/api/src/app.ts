import Fastify, { type FastifyError } from 'fastify'

import { env } from './env'
import { healthRoutes } from './modules/health/health.routes'
import { registerCors } from './plugins/cors'
import { registerSensible } from './plugins/sensible'

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
        : true,
  })

  await registerCors(app)
  await registerSensible(app)

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode ?? 500
    reply.status(statusCode).send({
      error: {
        message: error.message,
        statusCode,
      },
    })
  })

  await app.register(healthRoutes)

  return app
}
