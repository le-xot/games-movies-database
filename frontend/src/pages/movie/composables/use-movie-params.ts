import { createRecordParamsStore } from '@/composables/records/use-record-params'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

export const useMovieParams = createRecordParamsStore({
  storeName: 'movies/use-movie-params',
  genre: RecordGenre.MOVIE,
  localStorageKey: 'moviesColumnsVisibility',
  hasEpisode: false,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMovieParams, import.meta.hot))
}
