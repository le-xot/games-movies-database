import { describe, expect, it } from 'bun:test'
import { CocktailMethod, CocktailTier, IngredientCategory } from '@gmdb/contract'

describe('cocktail enums', () => {
  it('keeps tier values stable: they are persisted in pg enums', () => {
    expect(Object.values(CocktailTier)).toEqual(['CORE', 'EXTRA', 'FREE'])
  })

  it('keeps method values stable', () => {
    expect(Object.values(CocktailMethod)).toEqual(['SHAKE', 'STIR', 'BUILD', 'BLEND'])
  })

  it('keeps the eight shelf categories in display order', () => {
    expect(Object.values(IngredientCategory)).toEqual([
      'SPIRIT',
      'LIQUEUR',
      'WINE_BEER',
      'MIXER',
      'SYRUP',
      'BITTER',
      'FRESH',
      'PANTRY',
    ])
  })
})
