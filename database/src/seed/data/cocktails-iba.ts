import { CocktailMethod, CocktailTier } from '@gmdb/contract'
import type { SeedCocktail } from '../types'

/** Официальные рецепты IBA. */
export const COCKTAILS_IBA: SeedCocktail[] = [
  {
    id: 'negroni',
    name: 'Негрони',
    method: CocktailMethod.STIR,
    glass: 'Рокс',
    garnish: 'Апельсиновая цедра',
    note: 'Перемешать в стакане со льдом и отжать цедру над напитком',
    iba: true,
    sortOrder: 1,
    sourceName: 'IBA',
    sourceUrl: 'https://iba-world.com/negroni/',
    items: [
      { ingredientId: 'gin', amount: '30 мл', tier: CocktailTier.CORE },
      { ingredientId: 'campari', amount: '30 мл', tier: CocktailTier.CORE },
      { ingredientId: 'sweet-vermouth', amount: '30 мл', tier: CocktailTier.CORE },
    ],
  },
]
