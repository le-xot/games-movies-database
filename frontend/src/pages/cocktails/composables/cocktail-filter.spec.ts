import { describe, expect, it } from 'bun:test'
import { filterMatches } from '@/pages/cocktails/composables/cocktail-filter'
import type { MatchedCocktail } from '@/pages/cocktails/types'

function cocktail(
  name: string,
  missingCore: string[] = [],
  missingExtra: string[] = [],
): MatchedCocktail {
  return {
    id: name.toLowerCase(),
    name,
    method: 'SHAKE',
    glass: 'Коктейльный',
    garnish: null,
    note: null,
    sourceName: 'Сборник',
    sourceUrl: null,
    ingredients: [],
    missingCore,
    missingExtra,
  }
}

describe('filterMatches', () => {
  const cocktails = [
    cocktail('Мохито'),
    cocktail('Негрони', ['Кампари']),
    cocktail('Дайкири', ['Лайм', 'Сироп']),
    cocktail('Маргарита', ['Текила', 'Лайм', 'Трипл сек']),
  ]

  it('keeps only complete cocktails when maxMissing is 0', () => {
    expect(filterMatches(cocktails, 0, '').map((item) => item.name)).toEqual(['Мохито'])
  })

  it('allows up to maxMissing missing core ingredients', () => {
    expect(filterMatches(cocktails, 2, '').map((item) => item.name)).toEqual([
      'Мохито',
      'Негрони',
      'Дайкири',
    ])
  })

  it('does not look at missing extra ingredients', () => {
    const withExtras = [cocktail('Сприц', [], ['Апельсин', 'Лёд'])]
    expect(filterMatches(withExtras, 0, '').map((item) => item.name)).toEqual(['Сприц'])
  })

  it('matches the name case-insensitively', () => {
    expect(filterMatches(cocktails, 3, '  МАР ').map((item) => item.name)).toEqual(['Маргарита'])
  })

  it('returns everything for an empty query', () => {
    expect(filterMatches(cocktails, 3, '   ')).toHaveLength(cocktails.length)
  })

  it('preserves the original order', () => {
    expect(filterMatches(cocktails, 3, '').map((item) => item.name)).toEqual(
      cocktails.map((item) => item.name),
    )
  })

  it('does not mutate the input array', () => {
    const input = [...cocktails]
    filterMatches(input, 3, 'мо')
    expect(input).toHaveLength(cocktails.length)
  })
})
