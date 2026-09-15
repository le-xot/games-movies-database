import { foreignKey, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { records } from './records'
import { users } from './users'

export const likes = pgTable(
  'likes',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    recordId: integer('recordId').notNull(),
    createdAt: timestamp('createdAt', { precision: 3 }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('likes_userId_recordId_key').on(table.userId, table.recordId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'likes_userid_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [table.recordId],
      foreignColumns: [records.id],
      name: 'likes_recordId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ],
)
