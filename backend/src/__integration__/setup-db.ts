import process from 'node:process'
import { runMigrations } from '@gmd/database/migrations'
import { Pool } from 'pg'
import { assertTestDatabase } from './helpers/db'

const url = process.env.TEST_DATASOURCE_URL
if (process.env.RUN_DB_TESTS !== '1' || !url) {
  console.error('RUN_DB_TESTS=1 and TEST_DATASOURCE_URL are required')
  process.exit(1)
}
assertTestDatabase(url)

const target = new URL(url)
const dbName = target.pathname.slice(1)
const adminUrl = new URL(url)
adminUrl.pathname = '/postgres'
adminUrl.search = ''

const admin = new Pool({ connectionString: adminUrl.toString() })
try {
  const exists = await admin.query('select 1 from pg_database where datname = $1', [dbName])
  if ((exists.rowCount ?? 0) === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`)
  }
} finally {
  await admin.end()
}

const pool = new Pool({ connectionString: url })
try {
  await runMigrations(pool)
} finally {
  await pool.end()
}
console.log(`✅ test database ready: ${dbName}`)
