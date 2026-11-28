import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RecordGenre } from '@/lib/api'
import { GENRE_QUERY_KEYS } from '@/lib/genre-keys'
import { useMovieParams } from '@/pages/movie/composables/use-movie-params'

export const useMovie = createRecordsStore({
  storeId: 'movies/use-movie',
  queryKey: GENRE_QUERY_KEYS[RecordGenre.MOVIE],
  paramsStore: useMovieParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
