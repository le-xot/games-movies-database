import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { cocktailTierEnum, ingredientCategoryEnum } from './enums'

export const cocktailIngredients = pgTable('cocktail_ingredients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: ingredientCategoryEnum('category').notNull(),
  defaultTier: cocktailTierEnum('defaultTier').notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
})
