import { createRecordsStore } from '@/composables/factories/create-records-store'
import { useAnimeParams } from './use-anime-params'

export const useAnime = createRecordsStore({
  storeId: 'anime/use-anime',
  queryKey: 'anime',
  paramsStore: useAnimeParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
