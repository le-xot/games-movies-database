import { createRecordStore } from '@/composables/records/use-record-store'
import { acceptHMRUpdate } from 'pinia'
import { useGamesParams } from './use-games-params'

export const GAMES_QUERY_KEY = 'games'

export const useGames = createRecordStore({
  storeId: 'games/use-games',
  queryKey: GAMES_QUERY_KEY,
  paramsStoreGetter: useGamesParams,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGames, import.meta.hot))
}
