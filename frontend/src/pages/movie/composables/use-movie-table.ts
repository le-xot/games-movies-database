import { createTableStore } from '@/composables/factories/create-table-store'
import { acceptHMRUpdate } from 'pinia'
import { useMovie } from './use-movie'
import { useMovieParams } from './use-movie-params'

export const useMovieTable = createTableStore({
  storeId: 'movies/use-movies-table',
  dataStore: useMovie,
  paramsStore: useMovieParams,
  hasEpisodeColumn: false,
  titleSize: { admin: 55, user: 60 },
  deleteConfirmTitle: 'Удалить кинчик?',
  itemsKey: 'videos',
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMovieTable, import.meta.hot))
}
