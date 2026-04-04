import { createRecordsStore } from '@/composables/factories/create-records-store'
import { acceptHMRUpdate } from 'pinia'
import { useAnimeParams } from './use-anime-params'

export const useAnime = createRecordsStore({
  storeId: 'anime/use-anime',
  queryKey: 'anime',
  paramsStore: useAnimeParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnime, import.meta.hot))
}
