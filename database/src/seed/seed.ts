import process from 'node:process'
import { drizzle } from 'drizzle-orm/node-postgres'
import { createPool } from '../lib/connection'
import { cocktailIngredients, cocktailRecipeItems, cocktails } from '../schema'
import { CATALOG } from './catalog'
import { validateCatalog } from './validate'

/**
 * Одноразовый бутстрап каталога.
 *
 * Источник правды — прод-база: команда наполняет только пустые таблицы, а на
 * наполненной каталоге молча выходит с кодом 0. Ошибки валидатора печатаются
 * списком, код возврата — 1, вставки не происходит.
 */
async function main() {
  const pool = createPool()

  if (!pool) return

  try {
    const existing = await pool.query<{ count: number }>(
      'select count(*)::int as count from cocktail_ingredients',
    )

    if ((existing.rows[0]?.count ?? 0) > 0) {
      console.log('Каталог уже наполнен, бутстрап пропущен')
      return
    }

    const problems = validateCatalog(CATALOG)

    if (problems.length > 0) {
      console.error('❌ Каталог не прошёл валидацию:')
      for (const problem of problems) {
        console.error(`  - ${problem}`)
      }
      process.exitCode = 1
      return
    }

    const db = drizzle(pool)

    await db.transaction(async (tx) => {
      await tx.insert(cocktailIngredients).values(
        CATALOG.ingredients.map((ingredient, index) => ({
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          defaultTier: ingredient.defaultTier,
          sortOrder: ingredient.sortOrder ?? index,
        })),
      )

      await tx.insert(cocktails).values(
        CATALOG.cocktails.map((cocktail, index) => ({
          id: cocktail.id,
          name: cocktail.name,
          method: cocktail.method,
          glass: cocktail.glass,
          garnish: cocktail.garnish,
          note: cocktail.note,
          iba: cocktail.iba ?? false,
          sortOrder: cocktail.sortOrder ?? index,
          sourceName: cocktail.sourceName,
          sourceUrl: cocktail.sourceUrl ?? null,
        })),
      )

      const items = CATALOG.cocktails.flatMap((cocktail) =>
        cocktail.items.map((item, position) => ({
          cocktailId: cocktail.id,
          ingredientId: item.ingredientId,
          amount: item.amount,
          tier: item.tier ?? null,
          position,
        })),
      )

      if (items.length > 0) {
        await tx.insert(cocktailRecipeItems).values(items)
      }
    })

    console.log(
      `✅ Каталог наполнен: ${CATALOG.ingredients.length} ингредиентов, ${CATALOG.cocktails.length} коктейлей`,
    )
  } catch (error) {
    console.error('❌ Бутстрап каталога не удался:', error)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

await main()
