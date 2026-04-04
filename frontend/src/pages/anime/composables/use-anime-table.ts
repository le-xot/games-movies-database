import { createTableStore } from '@/composables/factories/create-table-store'
import { acceptHMRUpdate } from 'pinia'
import { useAnime } from './use-anime'
import { useAnimeParams } from './use-anime-params'

export const useAnimeTable = createTableStore({
  storeId: 'anime/use-anime-table',
  dataStore: useAnime,
  paramsStore: useAnimeParams,
  hasEpisodeColumn: true,
  titleSize: { admin: 45, user: 50 },
  episodeSize: 10,
  deleteConfirmTitle: 'Удалить анимешку?',
  itemsKey: 'videos',
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnimeTable, import.meta.hot))
}
