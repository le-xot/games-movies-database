<script setup lang="ts" generic="T extends RowData">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { pageSize } from './composables/use-pagination'
import type { PaginationState, RowData, Table } from '@tanstack/vue-table'

const props = defineProps<{
  total: number
  table: Table<T>
  pagination: PaginationState
}>()

const emits = defineEmits<{
  (event: 'update:page', page: number): void
  (event: 'update:pageSize', pageSize: number): void
}>()

const currentPage = computed(() => {
  if (props.pagination.pageIndex < 0) return 1
  return props.pagination.pageIndex + 1
})

function handleGoToPage(event: any) {
  const page = event.target.value ? Number(event.target.value) - 1 : 0
  if (Number.isNaN(page)) return
  emits('update:page', page < 0 ? 0 : page)
}

function handlePageSizeChange(pageSize: string) {
  emits('update:page', 0)
  const newSize = Number(pageSize)
  emits('update:pageSize', newSize)
}
</script>

<template>
  <div class="flex justify-end max-sm:flex-col gap-4">
    <div class="flex gap-2 items-center flex-wrap">
      <div class="flex gap-2 max-sm:justify-end max-sm:w-full flex-wrap">
        <div class="flex justify-center items-center text-muted-foreground text-nowrap">
          Показано с&nbsp; <strong>{{ pagination.pageIndex * pagination.pageSize + 1 }}</strong>&nbsp;по&nbsp;
          <strong>{{ Math.min((pagination.pageIndex + 1) * pagination.pageSize, total) }}</strong>&nbsp;запись из&nbsp;
          <strong>{{ total }}</strong>
        </div>
        <Button
          class="size-9 min-w-9 max-sm:w-full"
          variant="outline"
          size="icon"
          :disabled="!table.getCanPreviousPage()"
          @click="$emit('update:page', pagination.pageIndex - 1)"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Input
          class="w-15 h-9 max-sm:w-full"
          :min="1"
          :max="table.getPageCount()"
          :model-value="currentPage"
          inputmode="numeric"
          type="number"
          @input="handleGoToPage"
        />
        <Button
          class="size-9 min-w-9 max-sm:w-full"
          variant="outline"
          size="icon"
          :disabled="!table.getCanNextPage()"
          @click="$emit('update:page', pagination.pageIndex + 1)"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
      <div class="flex gap-2 items-center">
        <Select :default-value="pagination.pageSize.toString()" @update:model-value="handlePageSizeChange">
          <SelectTrigger class="h-9 justify-between gap-2">
            <div>
              <SelectValue class="flex-none" />
            </div>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem v-for="size in pageSize" :key="size" :value="size">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
