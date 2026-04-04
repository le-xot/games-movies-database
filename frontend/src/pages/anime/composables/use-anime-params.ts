import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'

export const useAnimeParams = createParamsStore({
  storeId: 'anime/use-anime-params',
  localStorageKey: 'columnsVisibility:anime',
  defaultColumnVisibility: {
    title: true,
    episode: true,
    user: true,
    status: true,
    grade: true,
  },
  genre: RecordGenre.ANIME,
})
