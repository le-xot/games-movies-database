import { api, unwrap } from '@/lib/api'
import type { CocktailMethod } from '@/lib/api'

/**
 * Типы ответов Eden выводим из самих запросов, а не дублируем руками:
 * единственный источник правды — TypeBox-схемы гейтвея.
 */
const catalogRequest = () => unwrap(api.cocktails.catalog.get())
const matchRequest = (input: Parameters<typeof api.cocktails.match.post>[0]) =>
  unwrap(api.cocktails.match.post(input))
const barRequest = () => unwrap(api.cocktails.bar.get())

export type CocktailCatalog = Awaited<ReturnType<typeof catalogRequest>>
export type CocktailShelf = CocktailCatalog['shelves'][number]
export type CocktailIngredient = CocktailShelf['ingredients'][number]

export type MatchedCocktail = Awaited<ReturnType<typeof matchRequest>>[number]
export type MatchedIngredient = MatchedCocktail['ingredients'][number]

export type CocktailBar = Awaited<ReturnType<typeof barRequest>>
export type CocktailMethodValue = CocktailMethod
