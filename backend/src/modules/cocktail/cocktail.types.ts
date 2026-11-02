import type { CocktailMethod, CocktailTier, IngredientCategory } from '@gmdb/contract'

/** Ингредиент из каталога — то, что лежит на полке бара. */
export interface CatalogIngredient {
  id: string
  name: string
  category: IngredientCategory
  defaultTier: CocktailTier
  sortOrder: number
}

/** Строка рецепта. `tier: null` — берётся `defaultTier` ингредиента. */
export interface CatalogRecipeItem {
  ingredientId: string
  amount: string
  tier: CocktailTier | null
  position: number
}

/** Коктейль из каталога целиком, без привязки к тому, что есть у пользователя. */
export interface CatalogCocktail {
  id: string
  name: string
  method: CocktailMethod
  glass: string
  garnish: string | null
  note: string | null
  sourceName: string
  sourceUrl: string | null
  items: CatalogRecipeItem[]
}

/** Строка рецепта после матчинга: уровень уже разрешён, наличие посчитано. */
export interface MatchedIngredient {
  id: string
  name: string
  amount: string
  tier: CocktailTier
  present: boolean
}

/** Коктейль, прошедший порог `maxMissing`, с разложенными недостающими. */
export interface MatchedCocktail {
  id: string
  name: string
  method: CocktailMethod
  glass: string
  garnish: string | null
  note: string | null
  sourceName: string
  sourceUrl: string | null
  ingredients: MatchedIngredient[]
  missingCore: string[]
  missingExtra: string[]
}
