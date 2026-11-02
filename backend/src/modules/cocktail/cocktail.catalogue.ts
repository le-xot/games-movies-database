import { IngredientCategory } from '@gmdb/contract'

/**
 * Заголовки полок бара. Порядок полок задаётся порядком ключей
 * `IngredientCategory`, поэтому здесь только подписи.
 */
export const SHELF_TITLES: Record<IngredientCategory, string> = {
  [IngredientCategory.SPIRIT]: 'Крепкое',
  [IngredientCategory.LIQUEUR]: 'Ликёры и ароматное',
  [IngredientCategory.WINE_BEER]: 'Вино и пиво',
  [IngredientCategory.MIXER]: 'Миксеры и соки',
  [IngredientCategory.SYRUP]: 'Сиропы',
  [IngredientCategory.BITTER]: 'Биттеры',
  [IngredientCategory.FRESH]: 'Свежее',
  [IngredientCategory.PANTRY]: 'Пантри',
}
