import { expect, it } from 'bun:test'
import {
  cocktailBarItems,
  cocktailIngredients,
  cocktailRecipeItems,
  cocktails,
  users,
} from '@gmd/database/schema'
import { eq } from 'drizzle-orm'
import { seedUser } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'

setupIntegrationSuite('Cocktails schema (integration)', ({ db }) => {
  async function seedIngredient(id: string) {
    await db.insert(cocktailIngredients).values({
      id,
      name: id,
      category: 'SPIRIT',
      defaultTier: 'CORE',
      sortOrder: 0,
    })
  }

  it('rejects deleting an ingredient referenced by a recipe', async () => {
    await seedIngredient('gin')
    await db.insert(cocktails).values({
      id: 'martini',
      name: 'Мартини',
      method: 'STIR',
      glass: 'Коктейльный',
      sourceName: 'IBA',
    })
    await db
      .insert(cocktailRecipeItems)
      .values({ cocktailId: 'martini', ingredientId: 'gin', amount: '60 мл', position: 0 })

    // Drizzle query builder — лишь thenable, `expect().rejects` требует настоящий Promise.
    const deleteGin = async () =>
      db.delete(cocktailIngredients).where(eq(cocktailIngredients.id, 'gin'))

    await expect(deleteGin()).rejects.toThrow()
  })

  it('drops bar items when the ingredient or the user is deleted', async () => {
    const user = await seedUser(db, 'bar-owner')
    await seedIngredient('lime')
    await db.insert(cocktailBarItems).values({ userId: user.id, ingredientId: 'lime' })

    expect(await db.select().from(cocktailBarItems)).toHaveLength(1)

    await db.delete(cocktailIngredients).where(eq(cocktailIngredients.id, 'lime'))
    expect(await db.select().from(cocktailBarItems)).toHaveLength(0)

    await seedIngredient('lime')
    await db.insert(cocktailBarItems).values({ userId: user.id, ingredientId: 'lime' })
    expect(await db.select().from(cocktailBarItems)).toHaveLength(1)

    await db.delete(users).where(eq(users.id, user.id))
    expect(await db.select().from(cocktailBarItems)).toHaveLength(0)
  })
})
