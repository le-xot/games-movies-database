import { createTableStore } from '@/composables/factories/create-table-store'
import { acceptHMRUpdate } from 'pinia'
import { useCartoon } from './use-cartoon'
import { useCartoonParams } from './use-cartoon-params'

export const useCartoonTable = createTableStore({
  storeId: 'cartoon/use-cartoon-table',
  dataStore: useCartoon,
  paramsStore: useCartoonParams,
  hasEpisodeColumn: true,
  titleSize: { admin: 47, user: 52 },
  episodeSize: 8,
  deleteConfirmTitle: 'Удалить мультик?',
  itemsKey: 'videos',
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartoonTable, import.meta.hot))
}
