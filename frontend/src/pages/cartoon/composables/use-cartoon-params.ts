import { createRecordParamsStore } from '@/composables/records/use-record-params'
import { RecordGenre } from '@/lib/api'
import { acceptHMRUpdate } from 'pinia'

export const useCartoonParams = createRecordParamsStore({
  storeName: 'cartoon/use-cartoon-params',
  genre: RecordGenre.CARTOON,
  localStorageKey: 'cartoonColumnsVisibility',
  hasEpisode: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartoonParams, import.meta.hot))
}
