import { createRecordsStore } from '@/composables/factories/create-records-store'
import { useGamesParams } from '@/pages/games/composables/use-games-params'

export const useGames = createRecordsStore({
  storeId: 'games/use-games',
  queryKey: 'games',
  paramsStore: useGamesParams,
  itemsName: 'games',
  refetchName: 'refetchGames',
})
