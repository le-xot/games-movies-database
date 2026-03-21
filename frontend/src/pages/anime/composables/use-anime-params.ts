import { createRecordParamsStore } from '@/composables/records/use-record-params'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

export const useAnimeParams = createRecordParamsStore({
  storeName: 'anime/use-anime-params',
  genre: RecordGenre.ANIME,
  localStorageKey: 'columnsVisibility',
  hasEpisode: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnimeParams, import.meta.hot))
}
