import { createRecordParamsStore } from '@/composables/records/use-record-params'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

export const useSeriesParams = createRecordParamsStore({
  storeName: 'series/use-series-params',
  genre: RecordGenre.SERIES,
  localStorageKey: 'seriesColumnsVisibility',
  hasEpisode: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSeriesParams, import.meta.hot))
}
