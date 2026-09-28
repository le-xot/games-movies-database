import { describe } from 'bun:test'
import * as schema from '@gmd/database/schema'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export const TEST_DATASOURCE_URL = process.env.TEST_DATASOURCE_URL

/** Интеграционные тесты включаются только явным флагом (unit-прогон остаётся без БД). */
export const integrationEnabled = process.env.RUN_DB_TESTS === '1' && Boolean(TEST_DATASOURCE_URL)

// В Bun 1.4.0 describe.skip всё равно вызывает callback — суиты делают `if (!integrationEnabled) return`.
export const integrationDescribe = integrationEnabled ? describe : describe.skip

const TABLE_NAMES = [
  'records',
  'users',
  'user_accounts',
  'likes',
  'limits',
  'suggestion_rules',
  'suggestion_ownerships',
  'wordle_games',
  'wordle_notification_subscriptions',
] as const

export function assertTestDatabase(url: string): void {
  const name = new URL(url).pathname.replace(/^\//, '')
  if (!name) throw new Error('TEST_DATASOURCE_URL has no database name')
  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to run integration tests against non-test database "${name}"`)
  }
}

export function createTestPool(): Pool {
  if (!TEST_DATASOURCE_URL) throw new Error('TEST_DATASOURCE_URL is not set')
  assertTestDatabase(TEST_DATASOURCE_URL)
  return new Pool({ connectionString: TEST_DATASOURCE_URL })
}

export function createTestDb(pool: Pool) {
  return drizzle(pool, { schema })
}

export async function truncateAll(pool: Pool): Promise<void> {
  await pool.query(
    `TRUNCATE TABLE ${TABLE_NAMES.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE`,
  )
}
