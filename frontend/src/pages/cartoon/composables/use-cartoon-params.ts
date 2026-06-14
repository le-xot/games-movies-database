import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'

export const useCartoonParams = createParamsStore({
  storeId: 'cartoon/use-cartoon-params',
  localStorageKey: 'columnsVisibility:cartoon',
  defaultColumnVisibility: {
    title: true,
    episode: true,
    user: true,
    status: true,
    grade: true,
  },
  genre: RecordGenre.CARTOON,
})
