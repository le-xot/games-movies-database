import { fileURLToPath } from 'node:url'

export const TEST_DATASOURCE_URL =
  process.env.TEST_DATASOURCE_URL ?? 'postgresql://le_xot:abc@127.0.0.1:5432/lists_test'
export const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? 3100)
export const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 5273)
export const ADMIN_STATE_FILE = fileURLToPath(new URL('../.auth/admin.json', import.meta.url))
