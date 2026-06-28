import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'

export const useCartoonParams = createParamsStore({
  storeId: 'cartoon/use-cartoon-params',
  genre: RecordGenre.CARTOON,
})
