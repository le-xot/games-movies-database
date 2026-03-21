import { createRecordTableStore } from '@/composables/records/use-record-table'
import { acceptHMRUpdate } from 'pinia'
import { useAnime } from './use-anime'
import { useAnimeParams } from './use-anime-params'

export const useAnimeTable = createRecordTableStore({
  storeId: 'anime/use-anime-table',
  recordStore: useAnime,
  paramsStore: useAnimeParams,
  deleteDialogTitle: 'Удалить анимешку?',
  hasEpisodeColumn: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnimeTable, import.meta.hot))
}
