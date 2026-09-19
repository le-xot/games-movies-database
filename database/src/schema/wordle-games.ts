import {
  date,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { currentTimestamp } from './defaults'
import { wordleGameStatusEnum } from './enums'
import { users } from './users'

export const wordleGames = pgTable(
  'wordle_games',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    date: date('date').notNull(),
    answer: text('answer').notNull(),
    guesses: jsonb('guesses').$type<string[]>().default([]).notNull(),
    status: wordleGameStatusEnum('status').default('IN_PROGRESS').notNull(),
    createdAt: timestamp('createdAt', { precision: 3 }).default(currentTimestamp).notNull(),
  },
  (table) => [
    uniqueIndex('wordle_games_userId_date_key').on(table.userId, table.date),
    index('wordle_games_status_date_idx').on(table.status, table.date),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'wordle_games_userid_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
)
