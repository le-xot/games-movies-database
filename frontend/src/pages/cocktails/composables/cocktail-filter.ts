import type { MatchedCocktail } from '@/pages/cocktails/types'

/**
 * Фильтрация выдачи на клиенте.
 *
 * Матчинг запрашивается один раз с максимальным порогом (`maxMissing: 3`),
 * а слайдер только сужает готовый список — это мгновенно и не ходит в сеть.
 */
export function filterMatches(
  cocktails: MatchedCocktail[],
  maxMissing: number,
  query: string,
): MatchedCocktail[] {
  const needle = query.trim().toLowerCase()

  return cocktails.filter((cocktail) => {
    if (cocktail.missingCore.length > maxMissing) return false
    if (needle === '') return true
    return cocktail.name.toLowerCase().includes(needle)
  })
}
