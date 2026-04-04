import { createRecordsStore } from '@/composables/factories/create-records-store'
import { acceptHMRUpdate } from 'pinia'
import { useGamesParams } from './use-games-params'

export const useGames = createRecordsStore({
  storeId: 'games/use-games',
  queryKey: 'games',
  paramsStore: useGamesParams,
  itemsName: 'games',
  refetchName: 'refetchGames',
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGames, import.meta.hot))
}
