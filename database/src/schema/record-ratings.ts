import { foreignKey, index, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { currentTimestamp } from './defaults'
import { recordGradeEnum } from './enums'
import { records } from './records'
import { isoTimestamp } from './timestamp'
import { users } from './users'

export const recordRatings = pgTable(
  'record_ratings',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    recordId: integer('recordId').notNull(),
    grade: recordGradeEnum('grade').notNull(),
    createdAt: isoTimestamp('createdAt').default(currentTimestamp).notNull(),
    updatedAt: isoTimestamp('updatedAt')
      .default(currentTimestamp)
      .notNull()
      .$onUpdate(() => currentTimestamp),
  },
  (table) => [
    uniqueIndex('record_ratings_userId_recordId_key').on(table.userId, table.recordId),
    index('record_ratings_recordId_idx').on(table.recordId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'record_ratings_userid_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [table.recordId],
      foreignColumns: [records.id],
      name: 'record_ratings_recordId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ],
)
