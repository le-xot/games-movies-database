import { createRecordsStore } from '@/composables/factories/create-records-store'
import { useMovieParams } from './use-movie-params'

export const useMovie = createRecordsStore({
  storeId: 'movies/use-movie',
  queryKey: 'movie',
  paramsStore: useMovieParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
