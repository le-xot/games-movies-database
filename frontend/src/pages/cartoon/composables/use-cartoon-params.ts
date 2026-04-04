import { createParamsStore } from '@/composables/factories/create-params-store'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartoonParams, import.meta.hot))
}
