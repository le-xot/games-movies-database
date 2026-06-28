import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'

export const useAnimeParams = createParamsStore({
  storeId: 'anime/use-anime-params',
  genre: RecordGenre.ANIME,
})
