import { CocktailTier, IngredientCategory } from '@gmdb/contract'
import type { SeedIngredient } from '../types'

/**
 * Ингредиенты снапшота.
 *
 * Порядок массива — порядок вывода: `sortOrder` не задаём, сид проставляет его
 * по индексу. Полки идут в порядке `IngredientCategory`.
 *
 * `ice` и `water` — `FREE`: лёд и вода есть всегда. Дэш-биттеры, гарнирная
 * зелень, специи, соль-сахар и яйцо — `EXTRA`. Остальное — `CORE`.
 * Аперитиво-биттеры (кампари, апероль, чинар, ферне) живут в `LIQUEUR`, а не в
 * `BITTER`: без них нет Негрони.
 */
export const INGREDIENTS: SeedIngredient[] = [
  // SPIRIT
  {
    id: 'gin',
    name: 'Джин',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'vodka',
    name: 'Водка',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'white-rum',
    name: 'Ром белый',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'dark-rum',
    name: 'Ром тёмный',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'golden-rum',
    name: 'Ром золотой',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'tequila-blanco',
    name: 'Текила бланко',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'tequila-reposado',
    name: 'Текила репосадо',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'mezcal',
    name: 'Мескаль',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'scotch-whisky',
    name: 'Виски шотландский',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'bourbon',
    name: 'Бурбон',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'rye-whiskey',
    name: 'Виски ржаной',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'cognac',
    name: 'Коньяк',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'brandy',
    name: 'Бренди',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'armagnac',
    name: 'Арманьяк',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'absinthe',
    name: 'Абсент',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'akvavit',
    name: 'Аквавит',
    category: IngredientCategory.SPIRIT,
    defaultTier: CocktailTier.CORE,
  },

  // LIQUEUR
  {
    id: 'triple-sec',
    name: 'Трипл-сек',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'cointreau',
    name: 'Куантро',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'campari',
    name: 'Кампари',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'aperol',
    name: 'Апероль',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'cynar',
    name: 'Чинар',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'fernet',
    name: 'Ферне',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'dry-vermouth',
    name: 'Вермут сухой',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'sweet-vermouth',
    name: 'Вермут сладкий',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'coffee-liqueur',
    name: 'Кофейный ликёр',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'cream-liqueur',
    name: 'Сливочный ликёр',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'amaretto',
    name: 'Амаретто',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'drambuie',
    name: 'Драмбуи',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'blue-curacao',
    name: 'Блю кюрасао',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'galliano',
    name: 'Гальяно',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'sambuca',
    name: 'Самбука',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'sherry-brandy',
    name: 'Шерри-бренди',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'benedictine',
    name: 'Бенедиктин',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'chartreuse',
    name: 'Шартрез',
    category: IngredientCategory.LIQUEUR,
    defaultTier: CocktailTier.CORE,
  },

  // WINE_BEER
  {
    id: 'prosecco',
    name: 'Просекко',
    category: IngredientCategory.WINE_BEER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'sparkling-dry',
    name: 'Игристое сухое',
    category: IngredientCategory.WINE_BEER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'red-wine',
    name: 'Вино красное сухое',
    category: IngredientCategory.WINE_BEER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'white-wine',
    name: 'Вино белое сухое',
    category: IngredientCategory.WINE_BEER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'sherry',
    name: 'Херес',
    category: IngredientCategory.WINE_BEER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'port',
    name: 'Портвейн',
    category: IngredientCategory.WINE_BEER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'light-beer',
    name: 'Пиво светлое',
    category: IngredientCategory.WINE_BEER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'cider',
    name: 'Сидр',
    category: IngredientCategory.WINE_BEER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'riesling',
    name: 'Рислинг',
    category: IngredientCategory.WINE_BEER,
    defaultTier: CocktailTier.CORE,
  },

  // MIXER
  {
    id: 'tonic',
    name: 'Тоник',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'soda',
    name: 'Содовая',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'cola',
    name: 'Кола',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'lemon-lime-soda',
    name: 'Спрайт / 7UP',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'ginger-ale',
    name: 'Имбирный эль',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'orange-juice',
    name: 'Сок апельсиновый',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'pineapple-juice',
    name: 'Сок ананасовый',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'tomato-juice',
    name: 'Сок томатный',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'grapefruit-juice',
    name: 'Сок грейпфрутовый',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'cranberry-juice',
    name: 'Сок клюквенный',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'cherry-juice',
    name: 'Сок вишнёвый',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'lime-juice',
    name: 'Сок лайма',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'lemon-juice',
    name: 'Сок лимона',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'coconut-milk',
    name: 'Кокосовое молоко',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'cream',
    name: 'Сливки',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'milk',
    name: 'Молоко',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'coffee',
    name: 'Кофе',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'tea',
    name: 'Чай',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'mineral-water',
    name: 'Минеральная вода',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'water',
    name: 'Вода',
    category: IngredientCategory.MIXER,
    defaultTier: CocktailTier.FREE,
  },

  // SYRUP
  {
    id: 'sugar-syrup',
    name: 'Сироп сахарный',
    category: IngredientCategory.SYRUP,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'grenadine',
    name: 'Гренадин',
    category: IngredientCategory.SYRUP,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'orgeat',
    name: 'Оршад',
    category: IngredientCategory.SYRUP,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'coconut-syrup',
    name: 'Сироп кокосовый',
    category: IngredientCategory.SYRUP,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'caramel-syrup',
    name: 'Сироп карамельный',
    category: IngredientCategory.SYRUP,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'raspberry-syrup',
    name: 'Сироп малиновый',
    category: IngredientCategory.SYRUP,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'honey-syrup',
    name: 'Сироп медовый',
    category: IngredientCategory.SYRUP,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'ginger-syrup',
    name: 'Сироп имбирный',
    category: IngredientCategory.SYRUP,
    defaultTier: CocktailTier.CORE,
  },

  // BITTER
  {
    id: 'angostura',
    name: 'Ангостура',
    category: IngredientCategory.BITTER,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'peychauds',
    name: 'Пешо',
    category: IngredientCategory.BITTER,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'orange-bitters',
    name: 'Биттер апельсиновый',
    category: IngredientCategory.BITTER,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'celery-bitters',
    name: 'Биттер сельдерея',
    category: IngredientCategory.BITTER,
    defaultTier: CocktailTier.EXTRA,
  },

  // FRESH
  {
    id: 'lime',
    name: 'Лайм',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'lemon',
    name: 'Лимон',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'orange',
    name: 'Апельсин',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'grapefruit',
    name: 'Грейпфрут',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'mint',
    name: 'Мята',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'basil',
    name: 'Базилик',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'cucumber',
    name: 'Огурец',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'egg-white',
    name: 'Белок яйца',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'egg-yolk',
    name: 'Яичный желток',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'cocktail-cherry',
    name: 'Вишня коктейльная',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'pineapple-chunk',
    name: 'Ананас (кусок)',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'strawberry',
    name: 'Клубника',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.CORE,
  },
  {
    id: 'fresh-ginger',
    name: 'Имбирь свежий',
    category: IngredientCategory.FRESH,
    defaultTier: CocktailTier.CORE,
  },

  // PANTRY
  {
    id: 'ice',
    name: 'Лёд',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.FREE,
  },
  {
    id: 'sugar',
    name: 'Сахар',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'powdered-sugar',
    name: 'Сахарная пудра',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'salt',
    name: 'Соль',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'honey',
    name: 'Мёд',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'cinnamon',
    name: 'Корица',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'nutmeg',
    name: 'Мускатный орех',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'cocoa',
    name: 'Какао',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'coffee-beans',
    name: 'Кофейные зёрна',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'chili-pepper',
    name: 'Перец чили',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
  {
    id: 'bay-leaf',
    name: 'Лавровый лист',
    category: IngredientCategory.PANTRY,
    defaultTier: CocktailTier.EXTRA,
  },
]
