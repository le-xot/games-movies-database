import { BadRequestException } from '@backend/utils/errors'
import { IngredientCategory } from '@gmdb/contract'
import { SHELF_TITLES } from './cocktail.catalogue'
import { matchCocktails } from './cocktail.match'
import type { CatalogCocktail, CatalogIngredient, MatchedCocktail } from './cocktail.types'

export interface CocktailCatalogShelf {
  id: IngredientCategory
  title: string
  ingredients: Array<{ id: string; name: string }>
}

export interface CocktailCatalog {
  shelves: CocktailCatalogShelf[]
}

/** Порт каталога: снимок ингредиентов с рецептами и бар пользователя. */
export interface CocktailRepository {
  findCatalog(): Promise<{ ingredients: CatalogIngredient[]; cocktails: CatalogCocktail[] }>
  findIngredientIds(): Promise<string[]>
  findBarIngredientIds(userId: string): Promise<string[]>
  replaceBar(userId: string, ingredientIds: string[]): Promise<void>
}

/** Полки идут в порядке `IngredientCategory`; пустые не отдаются. */
function buildShelves(ingredients: readonly CatalogIngredient[]): CocktailCatalogShelf[] {
  const shelves: CocktailCatalogShelf[] = []

  for (const category of Object.values(IngredientCategory)) {
    const shelfIngredients = ingredients
      .filter((ingredient) => ingredient.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru'))
      .map((ingredient) => ({ id: ingredient.id, name: ingredient.name }))

    if (shelfIngredients.length === 0) continue
    shelves.push({ id: category, title: SHELF_TITLES[category], ingredients: shelfIngredients })
  }

  return shelves
}

export class CocktailService {
  constructor(private readonly repository: CocktailRepository) {}

  async getCatalog(): Promise<CocktailCatalog> {
    const { ingredients } = await this.repository.findCatalog()

    return { shelves: buildShelves(ingredients) }
  }

  async match(input: { ingredientIds: string[]; maxMissing: number }): Promise<MatchedCocktail[]> {
    const { ingredients, cocktails } = await this.repository.findCatalog()
    const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]))

    return matchCocktails(cocktails, byId, input.ingredientIds, input.maxMissing)
  }

  async getBar(userId: string): Promise<{ ingredientIds: string[] }> {
    return { ingredientIds: await this.repository.findBarIngredientIds(userId) }
  }

  /** Полная замена бара: неизвестные id — 400, дубликаты схлопываются. */
  async setBar(userId: string, ingredientIds: string[]): Promise<{ ingredientIds: string[] }> {
    const unique = [...new Set(ingredientIds)]
    const known = new Set(await this.repository.findIngredientIds())

    for (const id of unique) {
      if (!known.has(id)) throw new BadRequestException(`Unknown ingredient: ${id}`)
    }

    await this.repository.replaceBar(userId, unique)

    return { ingredientIds: unique }
  }
}
