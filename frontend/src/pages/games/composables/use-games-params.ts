import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'

export const useGamesParams = createParamsStore({
  storeId: 'games/use-games-params',
  genre: RecordGenre.GAME,
})
