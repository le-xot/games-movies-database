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
  myRatings: '/db/ratings/my',
  userRatings: '/db/users/:id/ratings',
  wordle: '/db/wordle',
} as const

export type RouterPath = (typeof ROUTER_PATHS)[keyof typeof ROUTER_PATHS]
