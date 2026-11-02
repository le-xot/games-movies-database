import { CocktailTier } from '@gmdb/contract'
import type { SeedCatalog, SeedIngredient } from './types'

/**
 * Проверяет снапшот каталога до вставки.
 *
 * Возвращает список проблем: пустой массив — каталог можно заливать.
 * Правила повторяют ограничения таблиц (`id` уникальны, состав ссылается на
 * существующие ингредиенты, `position` уникален) плюс смысловые: у коктейля
 * обязан быть хотя бы один `CORE`, а `garnish` не дублирует `EXTRA`-строку.
 */
export function validateCatalog(catalog: SeedCatalog): string[] {
  const problems: string[] = []
  const ingredients = new Map<string, SeedIngredient>()

  for (const ingredient of catalog.ingredients) {
    if (ingredients.has(ingredient.id)) {
      problems.push(`ингредиент "${ingredient.id}": id дублируется`)
      continue
    }

    ingredients.set(ingredient.id, ingredient)
  }

  const cocktailIds = new Set<string>()

  for (const cocktail of catalog.cocktails) {
    const label = `коктейль "${cocktail.id}"`

    if (cocktailIds.has(cocktail.id)) {
      problems.push(`${label}: id дублируется`)
    }

    cocktailIds.add(cocktail.id)

    if (!cocktail.sourceName.trim()) {
      problems.push(`${label}: пустой sourceName`)
    }

    if (cocktail.sourceUrl != null && !cocktail.sourceUrl.startsWith('http')) {
      problems.push(`${label}: sourceUrl должен начинаться с http`)
    }

    const usedIngredients = new Set<string>()
    let hasCore = false

    for (const item of cocktail.items) {
      const ingredient = ingredients.get(item.ingredientId)

      if (usedIngredients.has(item.ingredientId)) {
        problems.push(`${label}: ингредиент "${item.ingredientId}" указан дважды`)
      }

      usedIngredients.add(item.ingredientId)

      if (!item.amount.trim()) {
        problems.push(`${label}: пустая доза у "${item.ingredientId}"`)
      }

      if (!ingredient) {
        problems.push(`${label}: неизвестный ингредиент "${item.ingredientId}"`)
        continue
      }

      const tier = item.tier ?? ingredient.defaultTier

      if (tier === CocktailTier.CORE) {
        hasCore = true
      }

      if (tier === CocktailTier.EXTRA && cocktail.garnish === ingredient.name) {
        problems.push(`${label}: garnish "${ingredient.name}" дублирует EXTRA-строку состава`)
      }
    }

    if (!hasCore) {
      problems.push(`${label}: нет ни одного CORE`)
    }
  }

  return problems
}
