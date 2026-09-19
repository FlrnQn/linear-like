import type { HealthCheckResponse } from '@lynx/types'
import type { FastifyPluginAsync } from 'fastify'

import { checkPostgresConnection } from '../../db/postgres'
import { checkRedisConnection } from '../../db/redis'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (): Promise<HealthCheckResponse> => {
    const [postgres, redis] = await Promise.all([checkPostgresConnection(), checkRedisConnection()])

    return {
      status: postgres && redis ? 'ok' : 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        postgres: postgres ? 'ok' : 'error',
        redis: redis ? 'ok' : 'error',
      },
    }
  })
}
