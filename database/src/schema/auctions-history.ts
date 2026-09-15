import { foreignKey, integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core'
import { records } from './records'

export const auctionsHistory = pgTable(
  'auctions_history',
  {
    id: serial('id').primaryKey(),
    winnerId: integer('winnerId').notNull(),
    createdAt: timestamp('createdAt', { precision: 3 }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.winnerId],
      foreignColumns: [records.id],
      name: 'auctions_history_winnerId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ],
)
