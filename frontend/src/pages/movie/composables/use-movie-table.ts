import { createRecordTableStore } from '@/composables/records/use-record-table'
import { acceptHMRUpdate } from 'pinia'
import { useMovie } from './use-movie'
import { useMovieParams } from './use-movie-params'

export const useMovieTable = createRecordTableStore({
  storeId: 'movies/use-movie-table',
  recordStore: useMovie,
  paramsStore: useMovieParams,
  deleteDialogTitle: 'Удалить кинчик?',
  hasEpisodeColumn: false,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMovieTable, import.meta.hot))
}
