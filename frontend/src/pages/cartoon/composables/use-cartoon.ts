import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RECORDS_QUERY_KEYS } from '@/composables/query-keys'
import { RecordGenre } from '@/lib/api'
import { useCartoonParams } from '@/pages/cartoon/composables/use-cartoon-params'

export const useCartoon = createRecordsStore({
  storeId: 'cartoon/use-cartoon',
  queryKey: RECORDS_QUERY_KEYS[RecordGenre.CARTOON],
  paramsStore: useCartoonParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
