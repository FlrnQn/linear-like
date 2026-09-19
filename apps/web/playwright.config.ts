import { defineConfig, devices } from '@playwright/test'

const API_PORT = 4010
const WEB_PORT = 5180

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Runs against a dedicated `lynx_test` database, isolated from both
      // the dev demo data and the Vitest backend suite's own test runs.
      // Invoked via `pnpm --filter` from the repo root so pnpm resolves the
      // `tsx` binary itself rather than relying on a raw spawn's PATH.
      command: `pnpm --filter @lynx/api exec cross-env NODE_ENV=test PORT=${API_PORT} DATABASE_URL=postgres://lynx:lynx@localhost:5432/lynx_test JWT_SECRET=lynx-e2e-secret-at-least-16-chars CORS_ORIGIN=http://localhost:${WEB_PORT} tsx watch src/server.ts`,
      cwd: '../..',
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `pnpm --filter @lynx/web exec cross-env VITE_API_URL=http://localhost:${API_PORT} vite --port ${WEB_PORT}`,
      cwd: '../..',
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
