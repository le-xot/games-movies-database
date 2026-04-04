import { createRecordsStore } from '@/composables/factories/create-records-store'
import { acceptHMRUpdate } from 'pinia'
import { useSeriesParams } from './use-series-params'

export const useSeries = createRecordsStore({
  storeId: 'series/use-series',
  queryKey: 'series',
  paramsStore: useSeriesParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSeries, import.meta.hot))
}
