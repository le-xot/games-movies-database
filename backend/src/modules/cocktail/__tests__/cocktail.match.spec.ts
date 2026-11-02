import { describe, expect, it } from 'bun:test'
import { matchCocktails } from '@backend/modules/cocktail/cocktail.match'
import { CocktailMethod, CocktailTier, IngredientCategory } from '@gmdb/contract'
import type { CatalogCocktail, CatalogIngredient } from '@backend/modules/cocktail/cocktail.types'

const { CORE, EXTRA, FREE } = CocktailTier

const INGREDIENTS = new Map<string, CatalogIngredient>([
  [
    'gin',
    {
      id: 'gin',
      name: 'Джин',
      category: IngredientCategory.SPIRIT,
      defaultTier: CORE,
      sortOrder: 1,
    },
  ],
  [
    'campari',
    {
      id: 'campari',
      name: 'Кампари',
      category: IngredientCategory.BITTER,
      defaultTier: CORE,
      sortOrder: 2,
    },
  ],
  [
    'ice',
    {
      id: 'ice',
      name: 'Лёд',
      category: IngredientCategory.PANTRY,
      defaultTier: FREE,
      sortOrder: 3,
    },
  ],
  [
    'bitter',
    {
      id: 'bitter',
      name: 'Биттер',
      category: IngredientCategory.BITTER,
      defaultTier: EXTRA,
      sortOrder: 4,
    },
  ],
])

const NEGRONI: CatalogCocktail = {
  id: 'negroni',
  name: 'Негрони',
  method: CocktailMethod.STIR,
  glass: 'Рокс',
  garnish: 'Апельсиновая цедра',
  note: null,
  sourceName: 'IBA',
  sourceUrl: 'https://iba-world.com/negroni',
  items: [
    { ingredientId: 'gin', amount: '30 мл', tier: null, position: 1 },
    { ingredientId: 'campari', amount: '30 мл', tier: null, position: 2 },
    { ingredientId: 'ice', amount: 'кубик', tier: null, position: 3 },
  ],
}

const SPRITZ: CatalogCocktail = {
  id: 'spritz',
  name: 'Спритц',
  method: CocktailMethod.BUILD,
  glass: 'Винный бокал',
  garnish: null,
  note: null,
  sourceName: 'IBA',
  sourceUrl: null,
  items: [
    { ingredientId: 'campari', amount: '50 мл', tier: EXTRA, position: 1 },
    { ingredientId: 'bitter', amount: '2 дэша', tier: null, position: 2 },
    { ingredientId: 'ice', amount: 'кубики', tier: null, position: 3 },
  ],
}

describe('matchCocktails', () => {
  it('includes a cocktail when everything is at hand', () => {
    const [negroni] = matchCocktails([NEGRONI], INGREDIENTS, ['gin', 'campari', 'ice'], 0)

    expect(negroni?.missingCore).toEqual([])
    expect(negroni?.missingExtra).toEqual([])
    expect(negroni?.ingredients.every((item) => item.present)).toBe(true)
  })

  it('counts a missing CORE ingredient only when maxMissing allows it', () => {
    expect(matchCocktails([NEGRONI], INGREDIENTS, ['gin'], 0)).toEqual([])
    const [negroni] = matchCocktails([NEGRONI], INGREDIENTS, ['gin'], 1)
    expect(negroni?.missingCore).toEqual(['Кампари'])
  })

  it('keeps a cocktail with a missing EXTRA ingredient and reports it', () => {
    const [spritz] = matchCocktails([SPRITZ], INGREDIENTS, ['campari'], 0)

    expect(spritz?.missingCore).toEqual([])
    expect(spritz?.missingExtra).toEqual(['Биттер'])
  })

  it('never treats a missing FREE ingredient as missing', () => {
    const [negroni] = matchCocktails([NEGRONI], INGREDIENTS, ['gin', 'campari'], 0)

    expect(negroni?.missingCore).toEqual([])
    expect(negroni?.missingExtra).toEqual([])
    expect(negroni?.ingredients.find((item) => item.id === 'ice')?.present).toBe(false)
  })

  it('makes an ingredient mandatory when the recipe row overrides its tier', () => {
    const bitterCore: CatalogCocktail = {
      ...SPRITZ,
      id: 'spritz-bitter-core',
      items: SPRITZ.items.map((item) =>
        item.ingredientId === 'bitter' ? { ...item, tier: CORE } : item,
      ),
    }

    expect(matchCocktails([bitterCore], INGREDIENTS, ['campari'], 0)).toEqual([])
    const [matched] = matchCocktails([bitterCore], INGREDIENTS, ['campari'], 1)
    expect(matched?.missingCore).toEqual(['Биттер'])
  })

  it('does not break on duplicate entries in have', () => {
    const [negroni] = matchCocktails([NEGRONI], INGREDIENTS, ['gin', 'gin', 'campari'], 0)

    expect(negroni?.missingCore).toEqual([])
    expect(negroni?.missingExtra).toEqual([])
  })

  it('returns only cocktails without CORE rows for an empty bar', () => {
    const matched = matchCocktails([NEGRONI, SPRITZ], INGREDIENTS, [], 0)

    expect(matched.map((cocktail) => cocktail.id)).toEqual(['spritz'])
    expect(matched[0]?.missingCore).toEqual([])
  })

  it('sorts by missing count and then by name', () => {
    const fewest = matchCocktails([SPRITZ, NEGRONI], INGREDIENTS, ['gin', 'campari', 'ice'], 0)
    expect(fewest.map((cocktail) => cocktail.name)).toEqual(['Негрони', 'Спритц'])

    const tie = matchCocktails([SPRITZ, NEGRONI], INGREDIENTS, [], 3)
    expect(tie.map((cocktail) => cocktail.name)).toEqual(['Негрони', 'Спритц'])
  })

  it('ignores ids in have that are absent from the catalog', () => {
    const unknown = matchCocktails([NEGRONI], INGREDIENTS, ['gin', 'campari', 'vodka'], 0)
    const known = matchCocktails([NEGRONI], INGREDIENTS, ['gin', 'campari'], 0)

    expect(unknown).toEqual(known)
  })
})
