import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'

export const useSeriesParams = createParamsStore({
  storeId: 'series/use-series-params',
  genre: RecordGenre.SERIES,
})
