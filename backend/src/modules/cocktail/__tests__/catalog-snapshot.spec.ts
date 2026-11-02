import { describe, expect, it } from 'bun:test'
import { CATALOG, validateCatalog } from '@gmd/database/seed'
import { CocktailTier } from '@gmdb/contract'

function cloneCatalog(): typeof CATALOG {
  return structuredClone(CATALOG)
}

function firstCocktail(catalog: typeof CATALOG) {
  const cocktail = catalog.cocktails[0]
  if (!cocktail) throw new Error('в CATALOG нет ни одного коктейля')
  return cocktail
}

function firstItem(cocktail: ReturnType<typeof firstCocktail>) {
  const item = cocktail.items[0]
  if (!item) throw new Error('у коктейля нет ни одной строки состава')
  return item
}

function ingredientName(catalog: typeof CATALOG, id: string): string {
  const ingredient = catalog.ingredients.find((entry) => entry.id === id)
  if (!ingredient) throw new Error(`нет ингредиента ${id}`)
  return ingredient.name
}

describe('validateCatalog', () => {
  it('пропускает настоящий каталог', () => {
    expect(validateCatalog(CATALOG)).toEqual([])
  })

  it('ловит ссылку на несуществующий ингредиент', () => {
    const catalog = cloneCatalog()
    firstCocktail(catalog).items.push({
      ingredientId: 'ghost-rum',
      amount: '10 мл',
      tier: CocktailTier.CORE,
    })

    const problems = validateCatalog(catalog)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('неизвестный ингредиент')
  })

  it('ловит дубликат id ингредиента', () => {
    const catalog = cloneCatalog()
    const ingredient = catalog.ingredients[0]
    if (!ingredient) throw new Error('в CATALOG нет ингредиентов')
    catalog.ingredients.push({ ...ingredient, name: `${ingredient.name} (копия)` })

    const problems = validateCatalog(catalog)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('дублируется')
  })

  it('ловит коктейль без единого CORE', () => {
    const catalog = cloneCatalog()
    const cocktail = firstCocktail(catalog)
    cocktail.garnish = null
    for (const item of cocktail.items) {
      item.tier = CocktailTier.EXTRA
    }

    const problems = validateCatalog(catalog)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('CORE')
  })

  it('ловит garnish, продублированный EXTRA-строкой состава', () => {
    const catalog = cloneCatalog()
    const cocktail = firstCocktail(catalog)
    const item = firstItem(cocktail)
    item.tier = CocktailTier.EXTRA
    cocktail.garnish = ingredientName(catalog, item.ingredientId)

    const problems = validateCatalog(catalog)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('garnish')
  })

  it('ловит пустую дозу', () => {
    const catalog = cloneCatalog()
    firstItem(firstCocktail(catalog)).amount = '   '

    const problems = validateCatalog(catalog)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('доза')
  })

  it('ловит дубликат позиции в рецепте', () => {
    const catalog = cloneCatalog()
    const cocktail = firstCocktail(catalog)
    cocktail.items.push({ ...firstItem(cocktail) })

    const problems = validateCatalog(catalog)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('дважды')
  })

  it('ловит пустой sourceName', () => {
    const catalog = cloneCatalog()
    firstCocktail(catalog).sourceName = ' '

    const problems = validateCatalog(catalog)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('sourceName')
  })

  it('ловит sourceUrl без http', () => {
    const catalog = cloneCatalog()
    firstCocktail(catalog).sourceUrl = 'iba-world.com/negroni'

    const problems = validateCatalog(catalog)

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('http')
  })
})
