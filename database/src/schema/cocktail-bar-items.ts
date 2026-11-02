import { foreignKey, pgTable, primaryKey, text } from 'drizzle-orm/pg-core'
import { cocktailIngredients } from './cocktail-ingredients'
import { currentTimestamp } from './defaults'
import { isoTimestamp } from './timestamp'
import { users } from './users'

export const cocktailBarItems = pgTable(
  'cocktail_bar_items',
  {
    userId: text('userId').notNull(),
    ingredientId: text('ingredientId').notNull(),
    createdAt: isoTimestamp('createdAt').default(currentTimestamp).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.ingredientId],
      name: 'cocktail_bar_items_userId_ingredientId_pkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'cocktail_bar_items_userId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [table.ingredientId],
      foreignColumns: [cocktailIngredients.id],
      name: 'cocktail_bar_items_ingredientId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
)
