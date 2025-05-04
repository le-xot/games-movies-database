import { usePagination } from '@/components/table/composables/use-pagination'
import { GenresEnum } from '@/lib/api.ts'
import { VisibilityState } from '@tanstack/vue-table'
import { refDebounced, useLocalStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAnimeParams = defineStore('anime/use-anime-params', () => {
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)
  const pagination = usePagination()

  const columnVisibility = useLocalStorage<VisibilityState>('columnsVisibility', {
    title: true,
    person: false,
    status: true,
    grade: true,
  })

  const animeParams = computed(() => {
    return {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      search: debouncedSearch.value,
      genre: GenresEnum.ANIME,
      orderBy: 'id',
      direction: 'desc',
    }
  })

  return {
    search,
    debouncedSearch,
    pagination,
    columnVisibility,
    animeParams,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnimeParams, import.meta.hot))
}
