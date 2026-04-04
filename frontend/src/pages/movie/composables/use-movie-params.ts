import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

export const useMovieParams = createParamsStore({
  storeId: 'movies/use-movie-params',
  localStorageKey: 'columnsVisibility:movie',
  defaultColumnVisibility: {
    title: true,
    user: true,
    status: true,
    grade: true,
  },
  genre: RecordGenre.MOVIE,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMovieParams, import.meta.hot))
}
