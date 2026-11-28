import { createRecordsStore } from '@/composables/factories/create-records-store'
import { RecordGenre } from '@/lib/api'
import { GENRE_QUERY_KEYS } from '@/lib/genre-keys'
import { useAnimeParams } from '@/pages/anime/composables/use-anime-params'

export const useAnime = createRecordsStore({
  storeId: 'anime/use-anime',
  queryKey: GENRE_QUERY_KEYS[RecordGenre.ANIME],
  paramsStore: useAnimeParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
