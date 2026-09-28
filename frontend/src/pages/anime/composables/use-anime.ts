import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RECORDS_QUERY_KEYS } from '@/composables/query-keys'
import { RecordGenre } from '@/lib/api'
import { useAnimeParams } from '@/pages/anime/composables/use-anime-params'

export const useAnime = createRecordsStore({
  storeId: 'anime/use-anime',
  queryKey: RECORDS_QUERY_KEYS[RecordGenre.ANIME],
  paramsStore: useAnimeParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
