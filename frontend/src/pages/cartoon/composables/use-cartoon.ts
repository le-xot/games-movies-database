import { createRecordsStore } from '@/composables/factories/create-records-store'
import { useCartoonParams } from './use-cartoon-params'

export const useCartoon = createRecordsStore({
  storeId: 'cartoon/use-cartoon',
  queryKey: 'cartoon',
  paramsStore: useCartoonParams,
  itemsName: 'videos',
  refetchName: 'refetchVideos',
})
