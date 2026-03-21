import { usePagination } from '@/components/table/composables/use-pagination'
import type { RecordGenre, RecordGrade, RecordStatus } from '@/lib/api'
import { RecordType } from '@/lib/api'
import type { RecordQueryParams } from '@/types/records'
import type { VisibilityState } from '@tanstack/vue-table'
import { refDebounced, useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

interface RecordParamsConfig {
  storeName: string
  genre: RecordGenre
  localStorageKey?: string
  hasEpisode?: boolean
}

/**
 * Generic composable for record params (search, filters, pagination)
 * Используется для anime, movie, games, series, cartoon
 */
export function createRecordParamsStore(config: RecordParamsConfig) {
  return defineStore(config.storeName, () => {
    const search = ref('')
    const debouncedSearch = refDebounced(search, 500)
    const pagination = usePagination()
    const statusesFilter = ref<RecordStatus[] | null>(null)
    const gradeFilter = ref<RecordGrade[] | null>(null)

    const columnVisibility = useLocalStorage<VisibilityState>(
      config.localStorageKey || 'columnsVisibility',
      {
        title: true,
        episode: config.hasEpisode ?? true,
        user: true,
        status: true,
        grade: true,
      }
    )

    const recordParams = computed<RecordQueryParams>(() => {
      const params: RecordQueryParams = {
        genre: config.genre,
        type: RecordType.WRITTEN,
        page: pagination.value.pageIndex + 1,
        limit: pagination.value.pageSize,
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
      recordParams,
      setGradeFilter,
      setStatusFilter,
    }
  })
}

// Для совместимости с HMR каждый конкретный store должен принимать acceptHMRUpdate отдельно
