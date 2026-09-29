import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import {
  ADMIN_STATE_FILE,
  BACKEND_PORT,
  FRONTEND_PORT,
  TEST_DATASOURCE_URL,
} from './e2e/helpers/env'

const backendDir = fileURLToPath(new URL('../backend', import.meta.url))
const frontendDir = fileURLToPath(new URL('.', import.meta.url))
const e2eJwtSecret = process.env.E2E_JWT_SECRET ?? randomUUID()

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: [
    {
      command:
        'bun run src/__integration__/setup-db.ts && bun run src/__e2e__/seed.ts && bun run ./src/main.ts',
      cwd: backendDir,
      url: `http://localhost:${BACKEND_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...(process.env as Record<string, string>),
        DATASOURCE_URL: TEST_DATASOURCE_URL,
        TEST_DATASOURCE_URL,
        RUN_DB_TESTS: '1',
        APP_PORT: String(BACKEND_PORT),
        CORS_ORIGINS: `http://localhost:${FRONTEND_PORT},http://localhost:${BACKEND_PORT}`,
        JWT_SECRET: e2eJwtSecret,
        E2E_STATE_FILE: ADMIN_STATE_FILE,
      },
    },
    {
      command: `bun run dev --port ${FRONTEND_PORT} --strictPort`,
      cwd: frontendDir,
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...(process.env as Record<string, string>),
        VITE_BACKEND_TARGET: `http://localhost:${BACKEND_PORT}`,
        SKIP_API_GENERATION: '1',
      },
    },
  ],
})
