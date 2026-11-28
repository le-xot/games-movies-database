import { RecordGenre } from '@/lib/api'
import { useAnime } from '@/pages/anime/composables/use-anime'
import { useAnimeParams } from '@/pages/anime/composables/use-anime-params'
import { useCartoon } from '@/pages/cartoon/composables/use-cartoon'
import { useCartoonParams } from '@/pages/cartoon/composables/use-cartoon-params'
import { useGames } from '@/pages/games/composables/use-games'
import { useGamesParams } from '@/pages/games/composables/use-games-params'
import { useMovie } from '@/pages/movie/composables/use-movie'
import { useMovieParams } from '@/pages/movie/composables/use-movie-params'
import { useSeries } from '@/pages/series/composables/use-series'
import { useSeriesParams } from '@/pages/series/composables/use-series-params'
import type { GenreParamsStore, GenreRecordsStore } from '@/lib/genre-registry'

export interface GenreStores {
  useRecords: () => GenreRecordsStore
  useParams: () => GenreParamsStore
}

/**
 * Связка «жанр → сторы». Единственное место, которое статически импортирует все
 * жанровые сторы: реестр жанров остаётся без зависимостей от страниц, поэтому
 * его можно импортировать и в роутер, и в навигацию, и в WS-обработчики.
 */
export const GENRE_STORES = {
  [RecordGenre.GAME]: { useRecords: useGames, useParams: useGamesParams },
  [RecordGenre.MOVIE]: { useRecords: useMovie, useParams: useMovieParams },
  [RecordGenre.ANIME]: { useRecords: useAnime, useParams: useAnimeParams },
  [RecordGenre.CARTOON]: { useRecords: useCartoon, useParams: useCartoonParams },
  [RecordGenre.SERIES]: { useRecords: useSeries, useParams: useSeriesParams },
} as const satisfies Record<RecordGenre, GenreStores>
