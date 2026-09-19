import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

import { pgPool } from './postgres'

async function main() {
  const db = drizzle(pgPool)
  await migrate(db, { migrationsFolder: './src/db/migrations' })
  await pgPool.end()
  console.log('Migrations applied.')
}

void main()
