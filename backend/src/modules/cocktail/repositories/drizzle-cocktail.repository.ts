import { DrizzleService } from '@backend/database/drizzle.service'
import { cocktailBarItems, cocktailIngredients } from '@gmd/database/schema'
import { asc, eq } from 'drizzle-orm'
import type { CocktailRepository } from '../cocktail.service'
import type { CatalogCocktail, CatalogIngredient } from '../cocktail.types'

export class DrizzleCocktailRepository implements CocktailRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findCatalog(): Promise<{
    ingredients: CatalogIngredient[]
    cocktails: CatalogCocktail[]
  }> {
    const [ingredients, cocktailRows] = await Promise.all([
      this.drizzle.db
        .select()
        .from(cocktailIngredients)
        .orderBy(asc(cocktailIngredients.sortOrder), asc(cocktailIngredients.name)),
      this.drizzle.db.query.cocktails.findMany({
        orderBy: (cocktail) => [asc(cocktail.sortOrder), asc(cocktail.name)],
        with: {
          items: { orderBy: (item) => [asc(item.position)] },
        },
      }),
    ])

    return {
      ingredients,
      cocktails: cocktailRows.map((cocktail) => ({
        id: cocktail.id,
        name: cocktail.name,
        method: cocktail.method,
        glass: cocktail.glass,
        garnish: cocktail.garnish,
        note: cocktail.note,
        sourceName: cocktail.sourceName,
        sourceUrl: cocktail.sourceUrl,
        items: cocktail.items.map((item) => ({
          ingredientId: item.ingredientId,
          amount: item.amount,
          tier: item.tier,
          position: item.position,
        })),
      })),
    }
  }

  async findIngredientIds(): Promise<string[]> {
    const rows = await this.drizzle.db
      .select({ id: cocktailIngredients.id })
      .from(cocktailIngredients)
      .orderBy(asc(cocktailIngredients.sortOrder), asc(cocktailIngredients.name))

    return rows.map((row) => row.id)
  }

  async findBarIngredientIds(userId: string): Promise<string[]> {
    const rows = await this.drizzle.db
      .select({ ingredientId: cocktailBarItems.ingredientId })
      .from(cocktailBarItems)
      .where(eq(cocktailBarItems.userId, userId))
      .orderBy(asc(cocktailBarItems.ingredientId))

    return rows.map((row) => row.ingredientId)
  }

  async replaceBar(userId: string, ingredientIds: string[]): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      await tx.delete(cocktailBarItems).where(eq(cocktailBarItems.userId, userId))

      if (ingredientIds.length === 0) return

      await tx
        .insert(cocktailBarItems)
        .values(ingredientIds.map((ingredientId) => ({ userId, ingredientId })))
    })
  }
}
