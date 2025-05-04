import { usePagination } from '@/components/table/composables/use-pagination'
import { GenresEnum, GradeEnum, StatusesEnum } from '@/lib/api.ts'
import { VisibilityState } from '@tanstack/vue-table'
import { refDebounced, useLocalStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAnimeParams = defineStore('anime/use-anime-params', () => {
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)
  const pagination = usePagination()
  const statusesFilter = ref<StatusesEnum | null>(null)
  const gradeFilter = ref<GradeEnum | null>(null)

  const columnVisibility = useLocalStorage<VisibilityState>('columnsVisibility', {
    title: true,
    person: false,
    status: true,
    grade: true,
  })

  const animeParams = computed(() => {
    const params: Record<string, any> = {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      search: debouncedSearch.value,
      genre: GenresEnum.ANIME,
      orderBy: 'id',
      direction: 'desc',
    }

    if (debouncedSearch.value) {
      params.search = debouncedSearch.value
    }

    if (statusesFilter.value !== null) {
      params.status = statusesFilter.value
    }

    if (gradeFilter.value !== null) {
      params.grade = gradeFilter.value
    }

    return params
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
