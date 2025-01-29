import { PaginationState } from '@tanstack/vue-table'
import { ref } from 'vue'

export function usePagination() {
  const pagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  return pagination
}
