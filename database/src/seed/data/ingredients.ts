import { CocktailTier, IngredientCategory } from '@gmdb/contract'
import type { SeedIngredient } from '../types'

/**
 * Ингредиенты снапшота.
 *
 * `ice` — `FREE`: лёд есть всегда. Биттеры-дэши и гарнирная зелень — `EXTRA`,
 * аперитиво-биттеры — `LIQUEUR` + `CORE` (без кампари нет Негрони).
 */
export const INGREDIENTS: SeedIngredient[] = [
  {
    id: 'gin',
    name: 'Джин',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
    sortOrder: 1,
  },
  {
    id: 'campari',
    name: 'Кампари',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
    sortOrder: 2,
  },
  {
    id: 'sweet-vermouth',
    name: 'Вермут сладкий',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
    sortOrder: 3,
  },
  {
    id: 'ice',
    name: 'Лёд',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.FREE,
    sortOrder: 4,
  },
]
