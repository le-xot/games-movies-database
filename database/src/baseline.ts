import { readMigrationFiles } from 'drizzle-orm/migrator'
import { createPool, MIGRATIONS_FOLDER } from './lib/connection'

const MIGRATIONS_SCHEMA = 'drizzle'
const MIGRATIONS_TABLE = '__drizzle_migrations'

async function main() {
  const pool = createPool()
  if (!pool) return

  try {
    const prismaTable = await pool.query(`select to_regclass('public._prisma_migrations') as table`)
    if (!prismaTable.rows[0]?.table) {
      console.error('_prisma_migrations not found, refusing to baseline')
      process.exitCode = 1
      return
    }

    await pool.query(`create schema if not exists "${MIGRATIONS_SCHEMA}"`)
    await pool.query(
      `create table if not exists "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" ` +
        `(id serial primary key, hash text not null, created_at bigint)`,
    )

    const existing = await pool.query(
      `select count(*)::int as count from "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}"`,
    )
    if ((existing.rows[0]?.count ?? 0) > 0) {
      console.log('Drizzle migrations table is not empty, nothing to baseline')
      return
    }

    const [first] = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER })
    if (!first) {
      console.error('No migration files found')
      process.exitCode = 1
      return
    }

    await pool.query(
      `insert into "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" ` +
        `("hash", "created_at") values ($1, $2)`,
      [first.hash, first.folderMillis],
    )
    console.log(`✅ Baselined ${first.hash} with created_at=${first.folderMillis}`)
  } catch (error) {
    console.error('❌ Baseline failed:', error)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

await main()
