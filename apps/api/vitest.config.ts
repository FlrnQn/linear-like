import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    globalSetup: ['./test/global-setup.ts'],
    // Every test file shares one lynx_test database — running files in
    // parallel would let two files' fixtures race on the same tables.
    fileParallelism: false,
    // Compiled build output must never be picked up as a second, stale copy
    // of the same test files (dist/ is gitignored but persists locally).
    exclude: ['**/node_modules/**', 'dist/**'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://lynx:lynx@localhost:5432/lynx_test',
      JWT_SECRET: 'lynx-test-secret-at-least-16-chars',
    },
  },
})
