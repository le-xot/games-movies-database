import { usePagination } from '@/components/table/composables/use-pagination'
import { GenresEnum } from '@/lib/api.ts'
import { VisibilityState } from '@tanstack/vue-table'
import { refDebounced, useLocalStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useCartoonParams = defineStore('cartoon/use-cartoon-params', () => {
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)
  const pagination = usePagination()

  const columnVisibility = useLocalStorage<VisibilityState>('cartoonColumnsVisibility', {
    title: true,
    person: false,
    status: true,
    grade: true,
  })

  const cartoonParams = computed(() => {
    return {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      search: debouncedSearch.value,
      genre: GenresEnum.CARTOON,
      orderBy: 'id',
      direction: 'desc',
    }
  })

  return {
    search,
    debouncedSearch,
    pagination,
    columnVisibility,
    cartoonParams,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartoonParams, import.meta.hot))
}
