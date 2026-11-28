import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RecordGenre } from '@/lib/api'
import { GENRE_QUERY_KEYS } from '@/lib/genre-keys'
import { useGamesParams } from '@/pages/games/composables/use-games-params'

export const useGames = createRecordsStore({
  storeId: 'games/use-games',
  queryKey: GENRE_QUERY_KEYS[RecordGenre.GAME],
  paramsStore: useGamesParams,
  itemsName: 'games',
  refetchName: 'refetchGames',
})
