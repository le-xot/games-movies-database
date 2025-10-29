import { usePagination } from '@/components/table/composables/use-pagination'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/lib/api'
import { VisibilityState } from '@tanstack/vue-table'
import { refDebounced, useLocalStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const useAnimeParams = defineStore('anime/use-anime-params', () => {
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)
  const pagination = usePagination()
  const statusesFilter = ref<RecordStatus[] | null>(null)
  const gradeFilter = ref<RecordGrade[] | null>(null)

  const columnVisibility = useLocalStorage<VisibilityState>('columnsVisibility', {
    title: true,
    episode: true,
    user: false,
    status: true,
    grade: true,
  })

  const animeParams = computed(() => {
    const params: Record<string, any> = {
      genre: RecordGenre.ANIME,
      type: RecordType.WRITTEN,
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      search: debouncedSearch.value,
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

  function setGradeFilter(value: RecordGrade[] | null) {
    gradeFilter.value = value
  }

  function setStatusFilter(value: RecordStatus[] | null) {
    statusesFilter.value = value
  }

  watch([search, statusesFilter, gradeFilter], () => {
    pagination.value.pageIndex = 0
  })

  return {
    search,
    debouncedSearch,
    pagination,
    columnVisibility,
    animeParams,
    setGradeFilter,
    setStatusFilter,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnimeParams, import.meta.hot))
}
