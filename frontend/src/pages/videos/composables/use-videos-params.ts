import { usePagination } from '@/components/table/composables/use-pagination'
import { VisibilityState } from '@tanstack/vue-table'
import { refDebounced, useLocalStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useVideosParams = defineStore('videos/use-videos-params', () => {
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)
  const pagination = usePagination()

  const columnVisibility = useLocalStorage<VisibilityState>('videosColumnsVisibility', {
    title: true,
    genre: true,
    person: false,
    status: true,
    grade: true,
  })

  const videosParams = computed(() => {
    return {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      search: debouncedSearch.value,
      orderBy: 'id',
      direction: 'desc',
    }
  })

  return {
    search,
    debouncedSearch,
    pagination,
    columnVisibility,
    videosParams,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVideosParams, import.meta.hot))
}
