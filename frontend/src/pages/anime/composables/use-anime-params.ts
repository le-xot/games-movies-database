import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnimeParams, import.meta.hot))
}
