import { afterAll, beforeAll, expect, it } from 'bun:test'
import {
  createTestDb,
  createTestPool,
  integrationDescribe,
  integrationEnabled,
  truncateAll,
} from './helpers/db'

integrationDescribe('integration harness', () => {
  if (!integrationEnabled) return
  const pool = createTestPool()
  const db = createTestDb(pool)

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
    expect(names).toEqual([
      'likes',
      'limits',
      'records',
      'suggestion_ownerships',
      'suggestion_rules',
      'user_accounts',
      'users',
      'wordle_games',
      'wordle_notification_subscriptions',
    ])
    await truncateAll(pool)
    expect(db).toBeDefined()
  })
})
