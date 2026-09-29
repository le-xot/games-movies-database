import { describe } from 'bun:test'
import * as schema from '@gmd/database/schema'
import { getTableName, is } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { PgTable } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'
import { assertTestDatabase } from '@/utils/assert-test-database'

export const TEST_DATASOURCE_URL = process.env.TEST_DATASOURCE_URL

if (process.env.RUN_DB_TESTS === '1' && !TEST_DATASOURCE_URL) {
  throw new Error('TEST_DATASOURCE_URL is required when RUN_DB_TESTS=1')
}

/** Интеграционные тесты включаются только явным флагом (unit-прогон остаётся без БД). */
export const integrationEnabled = process.env.RUN_DB_TESTS === '1' && Boolean(TEST_DATASOURCE_URL)

// В Bun 1.4.0 describe.skip всё равно вызывает callback — суиты делают `if (!integrationEnabled) return`.
export const integrationDescribe = integrationEnabled ? describe : describe.skip

/** Все таблицы схемы (для TRUNCATE и smoke-теста) — новые таблицы подхватываются автоматически. */
export const TABLE_NAMES = Object.values(schema)
  .filter((value) => is(value, PgTable))
  .map((table) => getTableName(table as PgTable))
  .sort()

export { assertTestDatabase }

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
