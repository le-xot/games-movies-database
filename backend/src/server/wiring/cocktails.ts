import type { GatewayDeps } from '@backend/gateway'
import type { CocktailService } from '@backend/modules/cocktail/cocktail.service'

export interface CocktailServices {
  cocktails: CocktailService
}

/** Порты бара: каталог, матчинг и личный набор ингредиентов. */
export function cocktailPorts({ cocktails }: CocktailServices): Pick<GatewayDeps, 'cocktails'> {
  return { cocktails }
}
