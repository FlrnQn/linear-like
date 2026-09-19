import { drizzle } from 'drizzle-orm/node-postgres'

import { pgPool } from './postgres'
import * as relations from './relations'
import * as schema from './schema'

export const db = drizzle(pgPool, {
  schema: { ...schema, ...relations },
  casing: 'snake_case',
})
