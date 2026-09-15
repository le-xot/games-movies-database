import { integer, pgTable, uniqueIndex } from 'drizzle-orm/pg-core'
import { limitTypeEnum } from './enums'

export const limits = pgTable(
  'limits',
  {
    name: limitTypeEnum('name').notNull(),
    quantity: integer('quantity').default(5).notNull(),
  },
  (table) => [uniqueIndex('limits_name_key').on(table.name)],
)
