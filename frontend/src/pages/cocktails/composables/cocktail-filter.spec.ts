import { describe, expect, it } from 'bun:test'
import { filterMatches, searchMatches } from '@/pages/cocktails/composables/cocktail-filter'
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

  it('keeps a cocktail with a missing extra in the default mode', () => {
    const withExtras = [cocktail('Сприц', [], ['Биттер'])]
    expect(filterMatches(withExtras, 0, '', false).map((item) => item.name)).toEqual(['Сприц'])
  })

  it('hides a cocktail with a missing extra in the strict mode', () => {
    const withExtras = [cocktail('Сприц', [], ['Биттер']), cocktail('Мохито')]
    expect(filterMatches(withExtras, 3, '', true).map((item) => item.name)).toEqual(['Мохито'])
  })

  it('keeps a cocktail whose extras are all present in the strict mode', () => {
    const complete = [cocktail('Сприц', [], [])]
    expect(filterMatches(complete, 0, '', true).map((item) => item.name)).toEqual(['Сприц'])
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

describe('searchMatches', () => {
  it('keeps a cocktail that needs more ingredients than the purchase filter allows', () => {
    const unmakeable = [cocktail('Негрони', ['Кампари', 'Красный вермут'])]

    expect(searchMatches(unmakeable, 'негрони').map((item) => item.name)).toEqual(['Негрони'])
  })

  it('matches the name case-insensitively and ignores surrounding spaces', () => {
    const cocktails = [cocktail('Негрони', ['Кампари']), cocktail('Мохито')]

    expect(searchMatches(cocktails, '  НЕГР ').map((item) => item.name)).toEqual(['Негрони'])
  })

  it('preserves the order of the matcher output', () => {
    const sorted = [
      cocktail('Апероль', []),
      cocktail('Бульвардье', ['Кампари']),
      cocktail('Негрони', ['Кампари']),
    ]

    expect(searchMatches(sorted, '').map((item) => item.name)).toEqual([
      'Апероль',
      'Бульвардье',
      'Негрони',
    ])
  })

  it('does not mutate the input array', () => {
    const input = [cocktail('Негрони', ['Кампари'])]
    searchMatches(input, 'нег')

    expect(input).toHaveLength(1)
  })
})
