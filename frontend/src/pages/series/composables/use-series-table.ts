import { createTableStore } from '@/composables/factories/create-table-store'
import { useSeries } from '@/pages/series/composables/use-series'
import { useSeriesParams } from '@/pages/series/composables/use-series-params'

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
