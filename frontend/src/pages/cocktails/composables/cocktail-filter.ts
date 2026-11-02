import type { MatchedCocktail } from '@/pages/cocktails/types'

/**
 * Фильтрация выдачи на клиенте.
 *
 * Матчинг запрашивается один раз с максимальным порогом (`maxMissing: 3`),
 * а сегменты докупки только сужают готовый список — это мгновенно и не ходит в сеть.
 *
 * `strictExtras` считает необязательные строки (`EXTRA`) обязательными: коктейль
 * с недостающим «по желанию» ингредиентом из выдачи пропадает.
 */
export function filterMatches(
  cocktails: MatchedCocktail[],
  maxMissing: number,
  query: string,
  strictExtras = false,
): MatchedCocktail[] {
  const needle = query.trim().toLowerCase()

  return cocktails.filter((cocktail) => {
    if (cocktail.missingCore.length > maxMissing) return false
    if (strictExtras && cocktail.missingExtra.length > 0) return false
    if (needle === '') return true
    return cocktail.name.toLowerCase().includes(needle)
  })
}
