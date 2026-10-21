import { ROUTER_PATHS } from '@/router/router-paths'

/**
 * Прогрев данных раздела до клика: пока курсор висит на пункте меню,
 * запрос уже уходит, и переключение происходит без скелетона.
 */
const prefetchers: Record<string, () => Promise<unknown>> = {
  [ROUTER_PATHS.dbAnime]: () =>
    import('@/pages/anime/composables/use-anime').then(({ useAnime }) => useAnime()),
  [ROUTER_PATHS.dbGames]: () =>
    import('@/pages/games/composables/use-games').then(({ useGames }) => useGames()),
  [ROUTER_PATHS.dbMovie]: () =>
    import('@/pages/movie/composables/use-movie').then(({ useMovie }) => useMovie()),
  [ROUTER_PATHS.dbSeries]: () =>
    import('@/pages/series/composables/use-series').then(({ useSeries }) => useSeries()),
  [ROUTER_PATHS.dbCartoon]: () =>
    import('@/pages/cartoon/composables/use-cartoon').then(({ useCartoon }) => useCartoon()),
}

export function prefetchMediaRecords(path: string) {
  void prefetchers[path]?.()
}
