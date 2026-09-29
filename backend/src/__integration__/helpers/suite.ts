import { afterAll, beforeEach } from 'bun:test'
import {
  createTestDb,
  createTestPool,
  integrationDescribe,
  integrationEnabled,
  truncateAll,
} from './db'
import type { TestDb } from './fixtures'
import type { Pool } from 'pg'

export interface IntegrationContext {
  pool: Pool
  db: TestDb
}

/**
 * Общий каркас интеграционного suite: гейт RUN_DB_TESTS, пул, truncate перед каждым тестом,
 * закрытие пула в afterAll. В Bun 1.4.0 describe.skip всё равно вызывает callback,
 * поэтому при выключенных тестах выходим до создания пула.
 */
export function setupIntegrationSuite(
  name: string,
  define: (context: IntegrationContext) => void,
): void {
  integrationDescribe(name, () => {
    if (!integrationEnabled) return
    const pool = createTestPool()
    const db = createTestDb(pool)

    beforeEach(async () => {
      await truncateAll(pool)
    })

    afterAll(async () => {
      await pool.end()
    })

    define({ pool, db })
  })
}
