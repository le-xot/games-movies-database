import { boolean, pgTable, uniqueIndex } from 'drizzle-orm/pg-core'
import { recordGenreEnum } from './enums'

export const suggestionRules = pgTable(
  'suggestion_rules',
  {
    genre: recordGenreEnum('genre').notNull(),
    permission: boolean('permission').default(true).notNull(),
  },
  (table) => [uniqueIndex('suggestion_rules_genre_key').on(table.genre)],
)
