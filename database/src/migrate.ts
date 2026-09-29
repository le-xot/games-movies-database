import { createPool } from './lib/connection'
import { runMigrations } from './lib/migrations'

async function main() {
  const pool = createPool()
  if (!pool) return

  try {
    const prismaTable = await pool.query(`select to_regclass('public._prisma_migrations') as table`)

    if (prismaTable.rows[0]?.table) {
      const drizzleTable = await pool.query(
        `select to_regclass('drizzle.__drizzle_migrations') as table`,
      )
      const count = drizzleTable.rows[0]?.table
        ? (await pool.query(`select count(*)::int as count from "drizzle"."__drizzle_migrations"`))
            .rows[0]?.count
        : 0

      if (!count) {
        console.error(
          'Prisma migration history detected but Drizzle is not baselined. Run "bun run baseline" first.',
        )
        process.exitCode = 1
        return
      }
    }

    console.log('🔌 Applying migrations')
    await runMigrations(pool)
    console.log('✅ Migrations applied')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

await main()
