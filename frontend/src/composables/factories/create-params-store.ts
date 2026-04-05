import { VisibilityState } from '@tanstack/vue-table'
import { refDebounced, useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { usePagination } from '@/components/table/composables/use-pagination'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/lib/api'

export interface ParamsStoreConfig {
  storeId: string
  localStorageKey: string
  defaultColumnVisibility: VisibilityState
  genre: RecordGenre
}

export function createParamsStore(config: ParamsStoreConfig) {
  return defineStore(config.storeId, () => {
    const search = ref('')
    const debouncedSearch = refDebounced(search, 500)
    const pagination = usePagination()
    const statusesFilter = ref<RecordStatus[] | null>(null)
    const gradeFilter = ref<RecordGrade[] | null>(null)

    const columnVisibility = useLocalStorage<VisibilityState>(
      config.localStorageKey,
      config.defaultColumnVisibility,
    )

    const params = computed(() => {
      const p: Record<string, any> = {
        genre: config.genre,
        type: RecordType.WRITTEN,
        page: pagination.value.pageIndex + 1,
        limit: pagination.value.pageSize,
        search: debouncedSearch.value,
        orderBy: 'id',
        direction: 'desc',
      }

      if (debouncedSearch.value) {
        p.search = debouncedSearch.value
      }

      if (statusesFilter.value !== null) {
        p.status = statusesFilter.value
      }

      if (gradeFilter.value !== null) {
        p.grade = gradeFilter.value
      }

      return p
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
      params,
      setGradeFilter,
      setStatusFilter,
    }
  })
}
