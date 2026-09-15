import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../migrations', import.meta.url))

export function createPool(): Pool | null {
  const connectionString = process.env.DATASOURCE_URL

  if (!connectionString) {
    console.error('DATASOURCE_URL is not set')
    process.exitCode = 1
    return null
  }

  return new Pool({ connectionString })
}
