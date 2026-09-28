import { afterAll, beforeAll, expect, it } from 'bun:test'
import {
  createTestPool,
  integrationDescribe,
  integrationEnabled,
  TABLE_NAMES,
  truncateAll,
} from './helpers/db'

integrationDescribe('integration harness', () => {
  if (!integrationEnabled) return
  const pool = createTestPool()

  beforeAll(async () => {
    await pool.query('select 1')
  })

  afterAll(async () => {
    await pool.end()
  })

  it('has all schema tables after migrations', async () => {
    const rows = await pool.query(
      `select tablename from pg_tables where schemaname = 'public' order by tablename`,
    )
    const names = rows.rows.map((row) => row.tablename)
    expect(names).toEqual(TABLE_NAMES)
    await truncateAll(pool)
  })
})
