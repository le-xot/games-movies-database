import { foreignKey, integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core'
import { cocktailIngredients } from './cocktail-ingredients'
import { cocktails } from './cocktails'
import { cocktailTierEnum } from './enums'

export const cocktailRecipeItems = pgTable(
  'cocktail_recipe_items',
  {
    cocktailId: text('cocktailId').notNull(),
    ingredientId: text('ingredientId').notNull(),
    amount: text('amount').notNull(),
    tier: cocktailTierEnum('tier'),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.cocktailId, table.ingredientId],
      name: 'cocktail_recipe_items_cocktailId_ingredientId_pkey',
    }),
    foreignKey({
      columns: [table.cocktailId],
      foreignColumns: [cocktails.id],
      name: 'cocktail_recipe_items_cocktailId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      columns: [table.ingredientId],
      foreignColumns: [cocktailIngredients.id],
      name: 'cocktail_recipe_items_ingredientId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ],
)
