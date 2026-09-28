import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RECORDS_QUERY_KEYS } from '@/composables/query-keys'
import { RecordGenre } from '@/lib/api'
import { useGamesParams } from '@/pages/games/composables/use-games-params'

export const useGames = createRecordsStore({
  storeId: 'games/use-games',
  queryKey: RECORDS_QUERY_KEYS[RecordGenre.GAME],
  paramsStore: useGamesParams,
  itemsName: 'games',
  refetchName: 'refetchGames',
})
