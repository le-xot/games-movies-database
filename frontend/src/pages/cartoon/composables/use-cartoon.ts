import { createRecordsStore } from '@/composables/factories/create-records-store'
import { acceptHMRUpdate } from 'pinia'
import { useCartoonParams } from './use-cartoon-params'

export const useCartoon = createRecordsStore({
  storeId: 'cartoon/use-cartoon',
  queryKey: 'cartoon',
  paramsStore: useCartoonParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartoon, import.meta.hot))
}
