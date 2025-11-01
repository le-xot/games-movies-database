import { PaginationState } from '@tanstack/vue-table'
import { useLocalStorage } from '@vueuse/core'
import { ref, watch } from 'vue'

export const PAGE_SIZES = [15, 30, 50, 100]

const storagePageSize = useLocalStorage('table-page-size', { pageSize: PAGE_SIZES[0] })

export function usePagination() {
  const pagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: storagePageSize.value.pageSize ?? PAGE_SIZES[0]!,
  })

  watch(pagination, (newVal) => {
    storagePageSize.value.pageSize = newVal.pageSize
  }, { deep: true })

  return pagination
}
