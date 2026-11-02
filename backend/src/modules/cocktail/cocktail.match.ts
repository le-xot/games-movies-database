import { CocktailTier } from '@gmdb/contract'
import type {
  CatalogCocktail,
  CatalogIngredient,
  MatchedCocktail,
  MatchedIngredient,
} from './cocktail.types'

/** Больше трёх недостающих CORE-ингредиентов — уже не «почти получится». */
const MAX_MISSING_LIMIT = 3

/**
 * Матчинг коктейлей по имеющимся ингредиентам.
 *
 * Чистая функция: ни БД, ни кэша, ни мутаций входа. `maxMissing` ограничивает
 * только `CORE` — недостающий `EXTRA` показывается в `missingExtra`, но
 * коктейль не выбрасывает, а `FREE` не считается отсутствующим никогда.
 * Порядок выдачи: по числу недостающих `CORE`, затем по имени (`ru`).
 *
 * @throws {RangeError} если `maxMissing` вне `0..3` — это ошибка разработчика.
 */
export function matchCocktails(
  cocktails: readonly CatalogCocktail[],
  ingredients: ReadonlyMap<string, CatalogIngredient>,
  have: readonly string[],
  maxMissing: number,
): MatchedCocktail[] {
  if (!Number.isInteger(maxMissing) || maxMissing < 0 || maxMissing > MAX_MISSING_LIMIT) {
    throw new RangeError(`maxMissing должен быть целым в диапазоне 0..${MAX_MISSING_LIMIT}`)
  }

  const present = new Set(have)
  const matched: MatchedCocktail[] = []

  for (const cocktail of cocktails) {
    const matchedIngredients: MatchedIngredient[] = []
    const missingCore: string[] = []
    const missingExtra: string[] = []

    for (const item of cocktail.items) {
      const ingredient = ingredients.get(item.ingredientId)
      // Каталог консистентен (FK в БД), поэтому строки без ингредиента невозможны:
      // пропуск — защита от битого входа, а не бизнес-правило.
      if (!ingredient) continue

      const tier = item.tier ?? ingredient.defaultTier
      const isPresent = present.has(item.ingredientId)

      matchedIngredients.push({
        id: ingredient.id,
        name: ingredient.name,
        amount: item.amount,
        tier,
        present: isPresent,
      })

      if (isPresent) continue
      if (tier === CocktailTier.CORE) missingCore.push(ingredient.name)
      else if (tier === CocktailTier.EXTRA) missingExtra.push(ingredient.name)
    }

    if (missingCore.length > maxMissing) continue

    matched.push({
      id: cocktail.id,
      name: cocktail.name,
      method: cocktail.method,
      glass: cocktail.glass,
      garnish: cocktail.garnish,
      note: cocktail.note,
      sourceName: cocktail.sourceName,
      sourceUrl: cocktail.sourceUrl,
      ingredients: matchedIngredients,
      missingCore,
      missingExtra,
    })
  }

  matched.sort((a, b) => {
    if (a.missingCore.length !== b.missingCore.length) {
      return a.missingCore.length - b.missingCore.length
    }
    return a.name.localeCompare(b.name, 'ru')
  })

  return matched
}
