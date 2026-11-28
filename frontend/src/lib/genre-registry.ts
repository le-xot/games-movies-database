import { Baby, Film, Gamepad2, JapaneseYen, Popcorn } from '@lucide/vue'
import { RecordGenre } from '@/lib/api'
import { GENRE_QUERY_KEYS } from '@/lib/genre-keys'
import { ROUTER_PATHS } from '@/router/router-paths'
import type { RecordsQueryParams } from '@/composables/factories/create-params-store'
import type { RecordEntity, RecordGrade, RecordStatus, RecordUpdateDTO } from '@/lib/api'
import type { Component } from 'vue'

/**
 * Единственное место, где описан жанр: путь и имя роута, подпись, иконка,
 * поведение страницы, query-ключ и прогрев. Новый жанр = запись здесь +
 * стор в `pages/media/genre-stores.ts` + данные в БД/контракте.
 */
export interface GenreEntry {
  genre: RecordGenre
  path: string
  routeName: string
  label: string
  icon: Component
  hasEpisodeColumn: boolean
  deleteConfirmTitle: string
  /** Префикс query-ключа: им пользуются стор и WS-инвалидация. */
  queryKey: string
  /** Динамический импорт стора, чтобы прогревать данные до клика. */
  prefetch: () => Promise<unknown>
}

export const GENRE_REGISTRY = {
  [RecordGenre.GAME]: {
    genre: RecordGenre.GAME,
    path: ROUTER_PATHS.dbGames,
    routeName: 'games',
    label: 'Игры',
    icon: Gamepad2,
    hasEpisodeColumn: false,
    deleteConfirmTitle: 'Удалить игру?',
    queryKey: GENRE_QUERY_KEYS[RecordGenre.GAME],
    prefetch: (): Promise<unknown> =>
      import('@/pages/games/composables/use-games').then(({ useGames }) => useGames()),
  },
  [RecordGenre.MOVIE]: {
    genre: RecordGenre.MOVIE,
    path: ROUTER_PATHS.dbMovie,
    routeName: 'movie',
    label: 'Фильмы',
    icon: Film,
    hasEpisodeColumn: false,
    deleteConfirmTitle: 'Удалить кинчик?',
    queryKey: GENRE_QUERY_KEYS[RecordGenre.MOVIE],
    prefetch: (): Promise<unknown> =>
      import('@/pages/movie/composables/use-movie').then(({ useMovie }) => useMovie()),
  },
  [RecordGenre.ANIME]: {
    genre: RecordGenre.ANIME,
    path: ROUTER_PATHS.dbAnime,
    routeName: 'anime',
    label: 'Аниме',
    icon: JapaneseYen,
    hasEpisodeColumn: true,
    deleteConfirmTitle: 'Удалить анимешку?',
    queryKey: GENRE_QUERY_KEYS[RecordGenre.ANIME],
    prefetch: (): Promise<unknown> =>
      import('@/pages/anime/composables/use-anime').then(({ useAnime }) => useAnime()),
  },
  [RecordGenre.CARTOON]: {
    genre: RecordGenre.CARTOON,
    path: ROUTER_PATHS.dbCartoon,
    routeName: 'cartoon',
    label: 'Мультфильмы',
    icon: Baby,
    hasEpisodeColumn: true,
    deleteConfirmTitle: 'Удалить мультик?',
    queryKey: GENRE_QUERY_KEYS[RecordGenre.CARTOON],
    prefetch: (): Promise<unknown> =>
      import('@/pages/cartoon/composables/use-cartoon').then(({ useCartoon }) => useCartoon()),
  },
  [RecordGenre.SERIES]: {
    genre: RecordGenre.SERIES,
    path: ROUTER_PATHS.dbSeries,
    routeName: 'series',
    label: 'Сериалы',
    icon: Popcorn,
    hasEpisodeColumn: true,
    deleteConfirmTitle: 'Удалить сирик?',
    queryKey: GENRE_QUERY_KEYS[RecordGenre.SERIES],
    prefetch: (): Promise<unknown> =>
      import('@/pages/series/composables/use-series').then(({ useSeries }) => useSeries()),
  },
} as const satisfies Record<RecordGenre, GenreEntry>

/** Канонический порядок жанров: статистика и группировка советов. */
export const GENRES = [
  GENRE_REGISTRY[RecordGenre.GAME],
  GENRE_REGISTRY[RecordGenre.MOVIE],
  GENRE_REGISTRY[RecordGenre.ANIME],
  GENRE_REGISTRY[RecordGenre.CARTOON],
  GENRE_REGISTRY[RecordGenre.SERIES],
] as const satisfies readonly GenreEntry[]

/** Порядок в боковом меню — отдельный, пользовательский. */
export const NAV_GENRES: GenreEntry[] = [
  GENRE_REGISTRY[RecordGenre.GAME],
  GENRE_REGISTRY[RecordGenre.ANIME],
  GENRE_REGISTRY[RecordGenre.MOVIE],
  GENRE_REGISTRY[RecordGenre.SERIES],
  GENRE_REGISTRY[RecordGenre.CARTOON],
]

/** Порядок групп в ленте советов. */
export const SUGGESTION_GENRES: GenreEntry[] = [
  GENRE_REGISTRY[RecordGenre.MOVIE],
  GENRE_REGISTRY[RecordGenre.GAME],
  GENRE_REGISTRY[RecordGenre.ANIME],
  GENRE_REGISTRY[RecordGenre.CARTOON],
  GENRE_REGISTRY[RecordGenre.SERIES],
]

export function genreLabel(genre: RecordGenre | null | undefined): string {
  return genre ? GENRE_REGISTRY[genre].label : ''
}

export const GENRES_BY_PATH: ReadonlyMap<string, GenreEntry> = new Map(
  GENRES.map((entry) => [entry.path, entry]),
)

/** Контракт жанрового стора: имя ключа в сторе зависит от жанра, остальное общее. */
export interface GenreRecordsStore {
  items: RecordEntity[]
  isLoading: boolean
  error: string | null
  hasNextPage: boolean
  isLoadingNext: boolean
  loadNextPage: () => Promise<unknown>
  retry: () => Promise<unknown>
  updateRecord: (payload: { id: number; data: RecordUpdateDTO }) => Promise<unknown>
  updatePoster: (payload: { id: number; url: string }) => Promise<unknown>
  deleteRecord: (id: number) => Promise<unknown>
}

/** Контракт стор параметров жанровой страницы. */
export interface GenreParamsStore {
  search: string
  statusesFilter: RecordStatus[] | null
  gradeFilter: RecordGrade[] | null
  params: RecordsQueryParams
  setGradeFilter: (value: RecordGrade[] | null) => void
  setStatusFilter: (value: RecordStatus[] | null) => void
}
