import { refDebounced } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  RecordControllerGetAllRecordsParamsDirectionEnum,
  RecordControllerGetAllRecordsParamsOrderByEnum,
  RecordGenre,
  RecordGrade,
  RecordStatus,
  RecordType,
} from '@/lib/api'
import type { Records } from '@/lib/api'

export type RecordsQueryParams = Records.RecordControllerGetAllRecords.RequestQuery

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
        orderBy: RecordControllerGetAllRecordsParamsOrderByEnum.Id,
        direction: RecordControllerGetAllRecordsParamsDirectionEnum.Desc,
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
