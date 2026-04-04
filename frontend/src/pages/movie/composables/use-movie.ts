import { createRecordsStore } from '@/composables/factories/create-records-store'
import { acceptHMRUpdate } from 'pinia'
import { useMovieParams } from './use-movie-params'

export const useMovie = createRecordsStore({
  storeId: 'movies/use-movie',
  queryKey: 'movie',
  paramsStore: useMovieParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMovie, import.meta.hot))
}
