import { createRecordTableStore } from '@/composables/records/use-record-table'
import { acceptHMRUpdate } from 'pinia'
import { useGames } from './use-games'
import { useGamesParams } from './use-games-params'

export const useGamesTable = createRecordTableStore({
  storeId: 'games/use-games-table',
  recordStore: useGames,
  paramsStore: useGamesParams,
  deleteDialogTitle: 'Удалить игрушку?',
  hasEpisodeColumn: false,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGamesTable, import.meta.hot))
}
