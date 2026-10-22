import { refDebounced } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  PathsRecordsGetParametersQueryDirection,
  PathsRecordsGetParametersQueryOrderBy,
  RecordGenre,
  RecordGrade,
  RecordStatus,
  RecordType,
} from '@/lib/api'

export type RecordsQueryParams = {
  genre?: RecordGenre
  type?: RecordType
  search?: string
  page?: number
  limit?: number
  orderBy?: PathsRecordsGetParametersQueryOrderBy
  direction?: PathsRecordsGetParametersQueryDirection
  status?: RecordStatus[]
  grade?: RecordGrade[]
}

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

    const params = computed<RecordsQueryParams>(() => {
      const p: RecordsQueryParams = {
        genre: config.genre,
        type: RecordType.WRITTEN,
        search: debouncedSearch.value,
        orderBy: PathsRecordsGetParametersQueryOrderBy.id,
        direction: PathsRecordsGetParametersQueryDirection.desc,
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
