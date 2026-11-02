import { COCKTAILS_CLASSICS } from './data/cocktails-classics'
import { COCKTAILS_IBA } from './data/cocktails-iba'
import { COCKTAILS_MODERN } from './data/cocktails-modern'
import { INGREDIENTS } from './data/ingredients'
import type { SeedCatalog } from './types'

/** Снапшот каталога: то, чем наполняется пустая база. */
export const CATALOG: SeedCatalog = {
  ingredients: INGREDIENTS,
  cocktails: [...COCKTAILS_IBA, ...COCKTAILS_CLASSICS, ...COCKTAILS_MODERN],
}
