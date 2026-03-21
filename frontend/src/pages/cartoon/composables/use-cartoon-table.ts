import { createRecordTableStore } from '@/composables/records/use-record-table'
import { acceptHMRUpdate } from 'pinia'
import { useCartoon } from './use-cartoon.ts'
import { useCartoonParams } from './use-cartoon-params.ts'

export const useCartoonTable = createRecordTableStore({
  storeId: 'cartoon/use-cartoon-table',
  recordStore: useCartoon,
  paramsStore: useCartoonParams,
  deleteDialogTitle: 'Удалить мультик?',
  hasEpisodeColumn: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartoonTable, import.meta.hot))
}
