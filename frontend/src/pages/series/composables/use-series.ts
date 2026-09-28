import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RECORDS_QUERY_KEYS } from '@/composables/query-keys'
import { RecordGenre } from '@/lib/api'
import { useSeriesParams } from '@/pages/series/composables/use-series-params'

export const useSeries = createRecordsStore({
  storeId: 'series/use-series',
  queryKey: RECORDS_QUERY_KEYS[RecordGenre.SERIES],
  paramsStore: useSeriesParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
