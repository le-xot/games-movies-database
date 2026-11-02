import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { cocktailMethodEnum } from './enums'

export const cocktails = pgTable('cocktails', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  method: cocktailMethodEnum('method').notNull(),
  glass: text('glass').notNull(),
  garnish: text('garnish'),
  note: text('note'),
  iba: boolean('iba').default(false).notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  sourceName: text('sourceName').notNull(),
  sourceUrl: text('sourceUrl'),
})
