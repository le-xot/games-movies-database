import { createRecordsStore } from '@/composables/factories/create-records-store'
import { useSeriesParams } from '@/pages/series/composables/use-series-params'

export const useSeries = createRecordsStore({
  storeId: 'series/use-series',
  queryKey: 'series',
  paramsStore: useSeriesParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
