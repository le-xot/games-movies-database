import { authModels, type Authenticator, requireAuthenticated } from '@backend/gateway/auth'
import { apiErrorModels, publicErrors, standardErrors } from '@backend/gateway/errors'
import { enumUnion } from '@backend/gateway/models'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { CocktailMethod, CocktailTier, IngredientCategory } from '@gmdb/contract'
import { Elysia, t } from 'elysia'
import type { CocktailCatalog } from '@backend/modules/cocktail/cocktail.service'
import type { MatchedCocktail } from '@backend/modules/cocktail/cocktail.types'

/**
 * Справочники коктейлей. Значения — из `@gmdb/contract`; TypeBox-схемы нужны,
 * потому что они же служат валидацией и источником типов фронта.
 */
const ingredientCategorySchema = enumUnion(IngredientCategory)
const cocktailTierSchema = enumUnion(CocktailTier)
const cocktailMethodSchema = enumUnion(CocktailMethod)

export const cocktailModels = {
  IngredientCategory: ingredientCategorySchema,
  CocktailTier: cocktailTierSchema,
  CocktailMethod: cocktailMethodSchema,
  CocktailIngredientDTO: t.Object({
    id: t.String(),
    name: t.String(),
    amount: t.String(),
    tier: t.Ref('CocktailTier'),
    present: t.Boolean(),
  }),
  CocktailDTO: t.Object({
    id: t.String(),
    name: t.String(),
    method: t.Ref('CocktailMethod'),
    glass: t.String(),
    garnish: t.Nullable(t.String()),
    note: t.Nullable(t.String()),
    sourceName: t.String(),
    sourceUrl: t.Nullable(t.String()),
    ingredients: t.Array(t.Ref('CocktailIngredientDTO')),
    missingCore: t.Array(t.String()),
    missingExtra: t.Array(t.String()),
  }),
  CocktailShelfIngredientDTO: t.Object({
    id: t.String(),
    name: t.String(),
  }),
  CocktailShelfDTO: t.Object({
    id: t.Ref('IngredientCategory'),
    title: t.String(),
    ingredients: t.Array(t.Ref('CocktailShelfIngredientDTO')),
  }),
  CocktailCatalogDTO: t.Object({
    shelves: t.Array(t.Ref('CocktailShelfDTO')),
  }),
  MatchCocktailsDTO: t.Object({
    ingredientIds: t.Array(t.String(), { maxItems: 300 }),
    maxMissing: t.Integer({ minimum: 0, maximum: 50 }),
  }),
  CocktailBarDTO: t.Object({
    ingredientIds: t.Array(t.String()),
  }),
}

export interface MatchCocktailsInput {
  ingredientIds: string[]
  maxMissing: number
}

/** Что гейтвею нужно от домена коктейлей. */
export interface CocktailsPort {
  getCatalog(): Promise<CocktailCatalog>
  match(input: MatchCocktailsInput): Promise<MatchedCocktail[]>
  getBar(userId: string): Promise<{ ingredientIds: string[] }>
  setBar(userId: string, ingredientIds: string[]): Promise<{ ingredientIds: string[] }>
}

export interface CocktailRouteDeps {
  cocktails: CocktailsPort
  auth: Authenticator
  rateLimit: RateLimiter
}

export function cocktailRoutes({ cocktails, auth, rateLimit }: CocktailRouteDeps) {
  const limit = rateLimitGuard(rateLimit)

  const requireBarOwner = async (request: Request) => await requireAuthenticated(auth, request)

  return new Elysia({ name: 'cocktails' })
    .model({ ...apiErrorModels, ...authModels, ...cocktailModels })
    .get(
      '/cocktails/catalog',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)

        return await cocktails.getCatalog()
      },
      {
        response: { 200: 'CocktailCatalogDTO' as const, ...publicErrors() },
      },
    )
    .post(
      '/cocktails/match',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)

        return await cocktails.match(ctx.body as MatchCocktailsInput)
      },
      {
        body: 'MatchCocktailsDTO' as const,
        response: {
          200: t.Array(t.Ref('CocktailDTO')),
          ...publicErrors(),
        },
      },
    )
    .get(
      '/cocktails/bar',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)

        return await cocktails.getBar((await requireBarOwner(ctx.request)).id)
      },
      {
        response: { 200: 'CocktailBarDTO' as const, ...standardErrors() },
      },
    )
    .put(
      '/cocktails/bar',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.cocktailBar)

        return await cocktails.setBar(
          (await requireBarOwner(ctx.request)).id,
          (ctx.body as { ingredientIds: string[] }).ingredientIds,
        )
      },
      {
        body: 'CocktailBarDTO' as const,
        response: { 200: 'CocktailBarDTO' as const, ...standardErrors() },
      },
    )
}
