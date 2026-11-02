import { expect, it } from 'bun:test'
import { DrizzleCocktailRepository } from '@backend/modules/cocktail/repositories/drizzle-cocktail.repository'
import { cocktailIngredients, cocktailRecipeItems, cocktails } from '@gmd/database/schema'
import { seedUser } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'
import type { DrizzleService } from '@backend/database/drizzle.service'

setupIntegrationSuite('Cocktail repository (integration)', ({ db }) => {
  const repository = new DrizzleCocktailRepository({ db } as unknown as DrizzleService)

  async function seedCatalog() {
    await db.insert(cocktailIngredients).values([
      {
        id: 'gin',
        name: 'Джин',
        category: 'SPIRIT',
        defaultTier: 'CORE',
        sortOrder: 1,
      },
      {
        id: 'campari',
        name: 'Кампари',
        category: 'LIQUEUR',
        defaultTier: 'CORE',
        sortOrder: 2,
      },
    ])
    await db.insert(cocktails).values({
      id: 'negroni',
      name: 'Негрони',
      method: 'STIR',
      glass: 'Рокс',
      sourceName: 'IBA',
    })
    // Строки вставлены вразнобой: порядок обязан прийти из `position`.
    await db.insert(cocktailRecipeItems).values([
      { cocktailId: 'negroni', ingredientId: 'campari', amount: '30 мл', position: 2 },
      {
        cocktailId: 'negroni',
        ingredientId: 'gin',
        amount: '30 мл',
        tier: 'EXTRA',
        position: 1,
      },
    ])
  }

  it('reads the catalog with recipe rows ordered by position', async () => {
    await seedCatalog()

    const catalog = await repository.findCatalog()

    expect(catalog.ingredients).toEqual([
      {
        id: 'gin',
        name: 'Джин',
        category: 'SPIRIT',
        defaultTier: 'CORE',
        sortOrder: 1,
      },
      {
        id: 'campari',
        name: 'Кампари',
        category: 'LIQUEUR',
        defaultTier: 'CORE',
        sortOrder: 2,
      },
    ])
    expect(catalog.cocktails).toHaveLength(1)

    const [negroni] = catalog.cocktails
    expect(negroni?.id).toBe('negroni')
    expect(negroni?.method).toBe('STIR')
    expect(negroni?.items).toEqual([
      { ingredientId: 'gin', amount: '30 мл', tier: 'EXTRA', position: 1 },
      { ingredientId: 'campari', amount: '30 мл', tier: null, position: 2 },
    ])
  })

  it('lists known ingredient ids', async () => {
    await seedCatalog()

    expect(await repository.findIngredientIds()).toEqual(['gin', 'campari'])
  })

  it('replaces the whole bar on every save', async () => {
    await seedCatalog()
    const user = await seedUser(db, 'bartender')

    await repository.replaceBar(user.id, ['gin'])
    await repository.replaceBar(user.id, ['campari', 'gin'])

    expect(await repository.findBarIngredientIds(user.id)).toEqual(['campari', 'gin'])

    await repository.replaceBar(user.id, [])

    expect(await repository.findBarIngredientIds(user.id)).toEqual([])
  })
})
