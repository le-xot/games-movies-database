import { foreignKey, integer, pgTable, serial, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { currentTimestamp } from './defaults'
import { records } from './records'
import { isoTimestamp } from './timestamp'
import { users } from './users'

export const suggestionOwnerships = pgTable(
  'suggestion_ownerships',
  {
    id: serial('id').primaryKey(),
    recordId: integer('recordId').notNull(),
    userId: text('userId').notNull(),
    createdAt: isoTimestamp('createdAt').default(currentTimestamp).notNull(),
  },
  (table) => [
    uniqueIndex('suggestion_ownerships_recordId_key').on(table.recordId),
    foreignKey({
      columns: [table.recordId],
      foreignColumns: [records.id],
      name: 'suggestion_ownerships_recordId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'suggestion_ownerships_userId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
)
