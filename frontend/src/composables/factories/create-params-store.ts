import { refDebounced } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/lib/api'

export interface ParamsStoreConfig {
  storeId: string
  genre: RecordGenre
}

export function createParamsStore(config: ParamsStoreConfig) {
  return defineStore(config.storeId, () => {
    const search = ref('')
    const debouncedSearch = refDebounced(search, 500)
    const statusesFilter = ref<RecordStatus[] | null>(null)
    const gradeFilter = ref<RecordGrade[] | null>(null)

    const params = computed(() => {
      const p: Record<string, any> = {
        genre: config.genre,
        type: RecordType.WRITTEN,
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

    return {
      search,
      debouncedSearch,
      params,
      statusesFilter,
      gradeFilter,
      setGradeFilter,
      setStatusFilter,
    }
  })
}
