import {
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { records } from './records'
import { users } from './users'

export const suggestionOwnerships = pgTable(
  'suggestion_ownerships',
  {
    id: serial('id').primaryKey(),
    recordId: integer('recordId').notNull(),
    userId: text('userId').notNull(),
    createdAt: timestamp('createdAt', { precision: 3 }).defaultNow().notNull(),
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
