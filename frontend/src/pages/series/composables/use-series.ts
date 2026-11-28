import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RecordGenre } from '@/lib/api'
import { GENRE_QUERY_KEYS } from '@/lib/genre-keys'
import { useSeriesParams } from '@/pages/series/composables/use-series-params'

export const useSeries = createRecordsStore({
  storeId: 'series/use-series',
  queryKey: GENRE_QUERY_KEYS[RecordGenre.SERIES],
  paramsStore: useSeriesParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
