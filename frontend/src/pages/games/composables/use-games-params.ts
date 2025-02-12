import { usePagination } from '@/components/table/composables/use-pagination'
import { VisibilityState } from '@tanstack/vue-table'
import { refDebounced, useLocalStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useGamesParams = defineStore('games/use-games-params', () => {
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)
  const pagination = usePagination()

  const columnVisibility = useLocalStorage<VisibilityState>('gamesColumnVisibility', {
    title: true,
    person: true,
    status: true,
    grade: true,
  })

  const gamesParams = computed(() => {
    return {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      search: debouncedSearch.value,
      orderBy: 'id',
      direction: 'asc',
    }
  })

  return {
    search,
    debouncedSearch,
    pagination,
    columnVisibility,
    gamesParams,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGamesParams, import.meta.hot))
}
