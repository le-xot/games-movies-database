import { createRecordStore } from '@/composables/records/use-record-store'
import { acceptHMRUpdate } from 'pinia'
import { useCartoonParams } from './use-cartoon-params'

export const VIDEOS_QUERY_KEY = 'cartoon'

export const useCartoon = createRecordStore({
  storeId: 'cartoon/use-cartoon',
  queryKey: VIDEOS_QUERY_KEY,
  paramsStoreGetter: useCartoonParams,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartoon, import.meta.hot))
}
