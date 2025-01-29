import { PaginationState } from '@tanstack/vue-table'
import { ref } from 'vue'

export const pageSize = ['15', '30', '50', '100']

export function usePagination() {
  const pagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: Number(pageSize[0]),
  })
  return pagination
}
