import { authModels, requireUser, resolveUser, type Authenticator } from '@backend/gateway/auth'
import { apiErrorModels, publicErrors, standardErrors } from '@backend/gateway/errors'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'
import type { CocktailCatalog } from '@backend/modules/cocktail/cocktail.service'
import type { MatchedCocktail } from '@backend/modules/cocktail/cocktail.types'

/**
 * Справочники коктейлей. Значения совпадают с `@gmdb/contract`; здесь они
 * продублированы литералами, потому что TypeBox-схемы — единственный источник
 * валидации и типов фронта.
 */
const ingredientCategorySchema = t.Union([
  t.Literal('SPIRIT'),
  t.Literal('LIQUEUR'),
  t.Literal('WINE_BEER'),
  t.Literal('MIXER'),
  t.Literal('SYRUP'),
  t.Literal('BITTER'),
  t.Literal('FRESH'),
  t.Literal('PANTRY'),
])

const cocktailTierSchema = t.Union([t.Literal('CORE'), t.Literal('EXTRA'), t.Literal('FREE')])

const cocktailMethodSchema = t.Union([
  t.Literal('SHAKE'),
  t.Literal('STIR'),
  t.Literal('BUILD'),
  t.Literal('BLEND'),
])

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
    maxMissing: t.Integer({ minimum: 0, maximum: 3 }),
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
  const limit = (
    ctx: {
      request: Request
      server: { requestIP: (r: Request) => { address: string } | null } | null
    },
    route: string,
    config: Parameters<typeof enforceRateLimit>[1]['config'],
  ) =>
    enforceRateLimit(rateLimit, {
      request: ctx.request,
      route,
      config,
      ip: ctx.server?.requestIP(ctx.request)?.address,
    })

  const requireBarOwner = async (request: Request) => requireUser(await resolveUser(auth, request))

  return new Elysia({ name: 'cocktails' })
    .model({ ...apiErrorModels, ...authModels, ...cocktailModels })
    .get(
      '/cocktails/catalog',
      async (ctx) => {
        await limit(ctx, 'CocktailController.getCatalog', RATE_LIMITS.public)

        return await cocktails.getCatalog()
      },
      {
        response: { 200: 'CocktailCatalogDTO' as const, ...publicErrors() },
      },
    )
    .post(
      '/cocktails/match',
      async (ctx) => {
        await limit(ctx, 'CocktailController.match', RATE_LIMITS.public)

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
        await limit(ctx, 'CocktailController.getBar', RATE_LIMITS.public)

        return await cocktails.getBar((await requireBarOwner(ctx.request)).id)
      },
      {
        response: { 200: 'CocktailBarDTO' as const, ...standardErrors() },
      },
    )
    .put(
      '/cocktails/bar',
      async (ctx) => {
        await limit(ctx, 'CocktailController.setBar', RATE_LIMITS.cocktailBar)

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
