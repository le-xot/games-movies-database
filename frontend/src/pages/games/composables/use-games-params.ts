import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

export const useGamesParams = createParamsStore({
  storeId: 'games/use-games-params',
  localStorageKey: 'columnsVisibility:games',
  defaultColumnVisibility: {
    title: true,
    user: true,
    status: true,
    grade: true,
  },
  genre: RecordGenre.GAME,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGamesParams, import.meta.hot))
}
