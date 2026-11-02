import { describe, expect, it, mock } from 'bun:test'
import {
  CocktailService,
  type CocktailRepository,
} from '@backend/modules/cocktail/cocktail.service'
import { BadRequestException } from '@backend/utils/errors'
import { CocktailMethod, CocktailTier, IngredientCategory } from '@gmdb/contract'
import type { CatalogCocktail, CatalogIngredient } from '@backend/modules/cocktail/cocktail.types'

const GIN: CatalogIngredient = {
  id: 'gin',
  name: 'Джин',
  category: IngredientCategory.SPIRIT,
  defaultTier: CocktailTier.CORE,
  sortOrder: 1,
}

const CAMPARI: CatalogIngredient = {
  id: 'campari',
  name: 'Кампари',
  category: IngredientCategory.LIQUEUR,
  defaultTier: CocktailTier.CORE,
  sortOrder: 2,
}

const NEGRONI: CatalogCocktail = {
  id: 'negroni',
  name: 'Негрони',
  method: CocktailMethod.STIR,
  glass: 'Рокс',
  garnish: null,
  note: null,
  sourceName: 'IBA',
  sourceUrl: null,
  items: [
    { ingredientId: 'gin', amount: '30 мл', tier: null, position: 1 },
    { ingredientId: 'campari', amount: '30 мл', tier: null, position: 2 },
  ],
}

interface FakeRepository extends CocktailRepository {
  replaceBarCalls: Array<{ userId: string; ingredientIds: string[] }>
}

function createRepository(
  overrides: {
    ingredients?: CatalogIngredient[]
    cocktails?: CatalogCocktail[]
    bar?: string[]
  } = {},
): FakeRepository {
  const ingredients = overrides.ingredients ?? [GIN, CAMPARI]
  const cocktails = overrides.cocktails ?? [NEGRONI]
  const replaceBarCalls: Array<{ userId: string; ingredientIds: string[] }> = []
  let bar = overrides.bar ?? []

  return {
    replaceBarCalls,
    findCatalog: mock(async () => ({ ingredients, cocktails })),
    findIngredientIds: mock(async () => ingredients.map((ingredient) => ingredient.id)),
    findBarIngredientIds: mock(async () => bar),
    replaceBar: mock(async (userId: string, ingredientIds: string[]) => {
      replaceBarCalls.push({ userId, ingredientIds: [...ingredientIds] })
      bar = [...ingredientIds]
    }),
  }
}

describe('CocktailService', () => {
  it('rejects an unknown ingredient on setBar without touching the bar', async () => {
    const repository = createRepository()
    const service = new CocktailService(repository)

    await expect(service.setBar('user-1', ['gin', 'absinthe'])).rejects.toThrow(BadRequestException)
    await expect(service.setBar('user-1', ['gin', 'absinthe'])).rejects.toThrow(
      'Unknown ingredient: absinthe',
    )
    expect(repository.replaceBar).not.toHaveBeenCalled()
  })

  it('deduplicates the bar before saving it', async () => {
    const repository = createRepository()
    const service = new CocktailService(repository)

    const result = await service.setBar('user-1', ['gin', 'campari', 'gin'])

    expect(repository.replaceBarCalls).toEqual([
      { userId: 'user-1', ingredientIds: ['gin', 'campari'] },
    ])
    expect(result).toEqual({ ingredientIds: ['gin', 'campari'] })
  })

  it('allows clearing the bar with an empty set', async () => {
    const repository = createRepository({ bar: ['gin'] })
    const service = new CocktailService(repository)

    const result = await service.setBar('user-1', [])

    expect(repository.replaceBarCalls).toEqual([{ userId: 'user-1', ingredientIds: [] }])
    expect(result).toEqual({ ingredientIds: [] })
    expect(await service.getBar('user-1')).toEqual({ ingredientIds: [] })
  })

  it('groups ingredients into non-empty shelves in IngredientCategory order', async () => {
    const repository = createRepository({
      ingredients: [
        { ...GIN, id: 'vodka', name: 'Водка', sortOrder: 2 },
        GIN,
        { ...CAMPARI, category: IngredientCategory.PANTRY, id: 'salt', name: 'Соль' },
        {
          ...CAMPARI,
          category: IngredientCategory.BITTER,
          id: 'angostura',
          name: 'Ангостура',
        },
      ],
    })
    const service = new CocktailService(repository)

    const catalog = await service.getCatalog()

    expect(catalog.shelves.map((shelf) => shelf.id)).toEqual([
      IngredientCategory.SPIRIT,
      IngredientCategory.BITTER,
      IngredientCategory.PANTRY,
    ])
    expect(catalog.shelves.map((shelf) => shelf.title)).toEqual(['Крепкое', 'Биттеры', 'Пантри'])
    expect(catalog.shelves[0]?.ingredients).toEqual([
      { id: 'gin', name: 'Джин' },
      { id: 'vodka', name: 'Водка' },
    ])
  })

  it('delegates matching to matchCocktails after a single catalog read', async () => {
    const repository = createRepository()
    const service = new CocktailService(repository)

    const matched = await service.match({ ingredientIds: ['gin'], maxMissing: 1 })

    expect(repository.findCatalog).toHaveBeenCalledTimes(1)
    expect(matched).toHaveLength(1)
    expect(matched[0]?.id).toBe('negroni')
    expect(matched[0]?.missingCore).toEqual(['Кампари'])
    expect(matched[0]?.ingredients.map((ingredient) => ingredient.present)).toEqual([true, false])
  })
})
