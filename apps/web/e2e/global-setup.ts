import { execFileSync } from 'node:child_process'

const TEST_DATABASE_URL = 'postgres://lynx:lynx@localhost:5432/lynx_test'

// Runs before Playwright's webServer entries start, so `lynx_test` is
// migrated regardless of whether the backend Vitest suite already ran this
// session. Shells out to the api package's own migration script rather than
// pulling drizzle-orm/pg into the frontend's dependencies.
export default function globalSetup() {
  execFileSync('pnpm', ['--filter', '@lynx/api', 'exec', 'tsx', 'src/db/migrate.ts'], {
    cwd: '../..',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  })
}
