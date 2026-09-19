import { Pool } from 'pg'

import { env } from '../env'

export const pgPool = new Pool({ connectionString: env.DATABASE_URL })

export async function checkPostgresConnection(): Promise<boolean> {
  try {
    await pgPool.query('SELECT 1')
    return true
  } catch {
    return false
  }
}
