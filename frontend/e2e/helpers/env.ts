import { fileURLToPath } from 'node:url'

export const TEST_DATASOURCE_URL =
  process.env.TEST_DATASOURCE_URL ?? 'postgresql://le_xot:abc@127.0.0.1:5432/lists_test'

function parsePort(value: string | undefined, name: string, fallback: number): number {
  const port = value === undefined ? fallback : Number(value)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`${name} должен быть валидным TCP-портом, получено: "${value}"`)
  }
  return port
}

export const BACKEND_PORT = parsePort(process.env.E2E_BACKEND_PORT, 'E2E_BACKEND_PORT', 3100)
export const FRONTEND_PORT = parsePort(process.env.E2E_FRONTEND_PORT, 'E2E_FRONTEND_PORT', 5273)
export const ADMIN_STATE_FILE = fileURLToPath(new URL('../.auth/admin.json', import.meta.url))
