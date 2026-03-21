import { createRecordStore } from '@/composables/records/use-record-store'
import { acceptHMRUpdate } from 'pinia'
import { useMovieParams } from './use-movie-params'

export const VIDEOS_QUERY_KEY = 'movie'

export const useMovie = createRecordStore({
  storeId: 'movies/use-movie',
  queryKey: VIDEOS_QUERY_KEY,
  paramsStoreGetter: useMovieParams,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMovie, import.meta.hot))
}
