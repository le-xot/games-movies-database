import { createRecordStore } from '@/composables/records/use-record-store'
import { acceptHMRUpdate } from 'pinia'
import { useSeriesParams } from './use-series-params'

export const VIDEOS_QUERY_KEY = 'series'

export const useSeries = createRecordStore({
  storeId: 'series/use-series',
  queryKey: VIDEOS_QUERY_KEY,
  paramsStoreGetter: useSeriesParams,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSeries, import.meta.hot))
}
