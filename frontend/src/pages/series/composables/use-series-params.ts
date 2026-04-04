import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

export const useSeriesParams = createParamsStore({
  storeId: 'series/use-series-params',
  localStorageKey: 'columnsVisibility:series',
  defaultColumnVisibility: {
    title: true,
    episode: true,
    user: true,
    status: true,
    grade: true,
  },
  genre: RecordGenre.SERIES,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSeriesParams, import.meta.hot))
}
