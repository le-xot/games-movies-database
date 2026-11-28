export const ROUTER_PATHS = {
  home: '/',
  db: '/db',
  pc: '/pc',
  admin: '/db/admin',
  dbGames: '/db/games',
  dbAnime: '/db/anime',
  dbMovie: '/db/movie',
  dbCartoon: '/db/cartoon',
  dbSeries: '/db/series',
  dbSuggestion: '/db/suggestion',
  dbStats: '/db/stats',
  friends: '/db/friends',
  myRatings: '/db/ratings/my',
  userRatings: '/db/users/:id/ratings',
  wordle: '/db/wordle',
  cocktails: '/db/cocktails',
  wordleMiniApp: '/tg/wordle',
  authTwitch: '/auth/callback/twitch',
  authKick: '/auth/callback/kick',
  authTelegram: '/auth/callback/telegram',
  notFound: '/:pathMatch(.*)*',
} as const

export type RouterPath = (typeof ROUTER_PATHS)[keyof typeof ROUTER_PATHS]

/**
 * Единственный источник имён маршрутов (кроме жанровых — они в реестре жанров):
 * `RouteNamedMap` в `types/vue-router.d.ts` выводится из этой таблицы, а dev-проверка
 * в `router.ts` — из её ключей. Новый маршрут = запись здесь + в `router.ts`.
 */
export const ROUTE_TABLE = {
  'home-layout': ROUTER_PATHS.home,
  home: ROUTER_PATHS.home,
  pc: ROUTER_PATHS.pc,
  db: ROUTER_PATHS.db,
  admin: ROUTER_PATHS.admin,
  suggestion: ROUTER_PATHS.dbSuggestion,
  stats: ROUTER_PATHS.dbStats,
  friends: ROUTER_PATHS.friends,
  'my-ratings': ROUTER_PATHS.myRatings,
  'user-ratings': ROUTER_PATHS.userRatings,
  wordle: ROUTER_PATHS.wordle,
  cocktails: ROUTER_PATHS.cocktails,
  'wordle-miniapp': ROUTER_PATHS.wordleMiniApp,
  'auth-twitch': ROUTER_PATHS.authTwitch,
  'auth-kick': ROUTER_PATHS.authKick,
  'auth-telegram': ROUTER_PATHS.authTelegram,
  'not-found': ROUTER_PATHS.notFound,
} as const

export type RouteName = keyof typeof ROUTE_TABLE
