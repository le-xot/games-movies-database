import { createRecordParamsStore } from '@/composables/records/use-record-params'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

export const useGamesParams = createRecordParamsStore({
  storeName: 'games/use-games-params',
  genre: RecordGenre.GAME,
  localStorageKey: 'gamesColumnsVisibility',
  hasEpisode: false,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGamesParams, import.meta.hot))
}
