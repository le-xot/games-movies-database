import type { CocktailMethod, CocktailTier, IngredientCategory } from '@gmdb/contract'

/** Ингредиент снапшота каталога — ровно то, что ляжет в `cocktail_ingredients`. */
export interface SeedIngredient {
  id: string
  name: string
  category: IngredientCategory
  defaultTier: CocktailTier
  sortOrder?: number
}

/** Коктейль снапшота каталога вместе со строками состава. */
export interface SeedCocktail {
  id: string
  name: string
  method: CocktailMethod
  glass: string
  garnish: string | null
  note: string | null
  sourceName: string
  sourceUrl?: string | null
  iba?: boolean
  sortOrder?: number
  items: Array<{ ingredientId: string; amount: string; tier?: CocktailTier }>
}

/** Каталог целиком: снапшот, которым наполняется пустая база. */
export interface SeedCatalog {
  ingredients: SeedIngredient[]
  cocktails: SeedCocktail[]
}
