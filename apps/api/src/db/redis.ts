import Redis from 'ioredis'

import { env } from '../env'

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
})

// Connection failures are surfaced through checkRedisConnection(); this
// prevents ioredis's unhandled 'error' events from crashing the process.
redis.on('error', () => {})

export async function checkRedisConnection(): Promise<boolean> {
  try {
    if (redis.status === 'wait' || redis.status === 'end') {
      await redis.connect()
    }
    const pong = await redis.ping()
    return pong === 'PONG'
  } catch {
    return false
  }
}
