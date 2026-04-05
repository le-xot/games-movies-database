import { createTableStore } from '@/composables/factories/create-table-store'
import { useCartoon } from '@/pages/cartoon/composables/use-cartoon'
import { useCartoonParams } from '@/pages/cartoon/composables/use-cartoon-params'

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
