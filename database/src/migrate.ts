import process from 'node:process'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

async function main() {
  const connectionString = process.env.DATASOURCE_URL

  if (!connectionString) {
    console.error('DATASOURCE_URL is not set')
    process.exitCode = 1
    return
  }

  const pool = new Pool({ connectionString })

  try {
    console.log('🔌 Applying migrations')
    await migrate(drizzle(pool), {
      migrationsFolder: new URL('../migrations', import.meta.url).pathname,
    })
    console.log('✅ Migrations applied')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

await main()
