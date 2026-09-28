import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RECORDS_QUERY_KEYS } from '@/composables/query-keys'
import { RecordGenre } from '@/lib/api'
import { useMovieParams } from '@/pages/movie/composables/use-movie-params'

export const useMovie = createRecordsStore({
  storeId: 'movies/use-movie',
  queryKey: RECORDS_QUERY_KEYS[RecordGenre.MOVIE],
  paramsStore: useMovieParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
