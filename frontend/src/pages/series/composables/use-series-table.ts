import { createRecordTableStore } from '@/composables/records/use-record-table'
import { acceptHMRUpdate } from 'pinia'
import { useSeries } from './use-series'
import { useSeriesParams } from './use-series-params'

export const useSeriesTable = createRecordTableStore({
  storeId: 'series/use-series-table',
  recordStore: useSeries,
  paramsStore: useSeriesParams,
  deleteDialogTitle: 'Удалить сериал?',
  hasEpisodeColumn: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSeriesTable, import.meta.hot))
}
