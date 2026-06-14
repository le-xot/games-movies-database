import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'

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
