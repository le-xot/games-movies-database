import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RecordGenre } from '@/lib/api'
import { GENRE_QUERY_KEYS } from '@/lib/genre-keys'
import { useCartoonParams } from '@/pages/cartoon/composables/use-cartoon-params'

export const useCartoon = createRecordsStore({
  storeId: 'cartoon/use-cartoon',
  queryKey: GENRE_QUERY_KEYS[RecordGenre.CARTOON],
  paramsStore: useCartoonParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
