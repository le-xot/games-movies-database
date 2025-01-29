import { PaginationState } from '@tanstack/vue-table'
import { useLocalStorage } from '@vueuse/core'
import { ref, watch } from 'vue'

export const pageSize = ['15', '30', '50', '100']

const storagePageSize = useLocalStorage('table-page-size', { pageSize: Number(pageSize[0]) })

export function usePagination() {
  const pagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: Number(storagePageSize.value.pageSize),
  })

  watch(pagination, (newVal) => {
    storagePageSize.value.pageSize = newVal.pageSize
  }, { deep: true })

  return pagination
}
