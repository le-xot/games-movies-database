import { createRecordStore } from '@/composables/records/use-record-store'
import { acceptHMRUpdate } from 'pinia'
import { useAnimeParams } from './use-anime-params'

export const VIDEOS_QUERY_KEY = 'anime'

export const useAnime = createRecordStore({
  storeId: 'anime/use-anime',
  queryKey: VIDEOS_QUERY_KEY,
  paramsStoreGetter: useAnimeParams,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnime, import.meta.hot))
}
