import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

// Vitest's `test.env` config only reaches per-file workers, not this
// globalSetup process, so the test database URL is repeated here.
const TEST_DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://lynx:lynx@localhost:5432/lynx_test'

const TABLES = [
  'activities',
  'comments',
  'issue_labels',
  'issues',
  'cycles',
  'projects',
  'team_members',
  'teams',
  'workspace_members',
  'sessions',
  'workspaces',
  'labels',
  'users',
]

export default async function globalSetup() {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL })
  const db = drizzle(pool)

  await migrate(db, { migrationsFolder: './src/db/migrations' })
  await pool.query(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`)
  await pool.end()
}
