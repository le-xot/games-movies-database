import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { MIGRATIONS_FOLDER } from './connection'
import type { Pool } from 'pg'

export { MIGRATIONS_FOLDER }

export async function runMigrations(pool: Pool): Promise<void> {
  await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER })
}
