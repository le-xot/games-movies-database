import crypto from 'node:crypto'
import { likes, users } from '@gmd/database/schema'
import { UserRole } from '@/enums'
import type { CreateRecordData } from '@/modules/record/entities/record-domain.entity'
import type { InsertRow } from '@gmd/database'
import type * as schema from '@gmd/database/schema'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

export type TestDb = NodePgDatabase<typeof schema>

export async function seedUser(db: TestDb, login: string, role: UserRole = UserRole.USER) {
  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      login,
      role,
      profileImageUrl: '',
      color: '#333333',
    })
    .returning()
  if (!user) throw new Error('seedUser failed')
  return user
}

export function seedRecord(overrides: Partial<InsertRow<'records'>> = {}): InsertRow<'records'> {
  return {
    title: 'Test Record',
    posterUrl: '',
    link: 'https://example.com/record',
    ...overrides,
  }
}

export function recordCreateData(overrides: Partial<CreateRecordData> = {}): CreateRecordData {
  return {
    title: 'Test Record',
    posterUrl: '',
    link: 'https://example.com/record',
    ...overrides,
  }
}

export async function seedLike(db: TestDb, userId: string, recordId: number) {
  const [like] = await db
    .insert(likes)
    .values({ id: crypto.randomUUID(), userId, recordId })
    .returning()
  if (!like) throw new Error('seedLike failed')
  return like
}
