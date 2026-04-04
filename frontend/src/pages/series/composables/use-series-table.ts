import { createTableStore } from '@/composables/factories/create-table-store'
import { acceptHMRUpdate } from 'pinia'
import { useSeries } from './use-series'
import { useSeriesParams } from './use-series-params'

export const useSeriesTable = createTableStore({
  storeId: 'series/use-series-table',
  dataStore: useSeries,
  paramsStore: useSeriesParams,
  hasEpisodeColumn: true,
  titleSize: { admin: 47, user: 52 },
  episodeSize: 8,
  deleteConfirmTitle: 'Удалить сирик?',
  itemsKey: 'videos',
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSeriesTable, import.meta.hot))
}
