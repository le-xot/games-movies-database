<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { computed } from 'vue'
import { PAGE_SIZES } from '@/components/table/composables/use-pagination'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PaginationState, Table } from '@tanstack/vue-table'

const props = defineProps<{
  totalRecords: number
  table: Table<any>
}>()

const pagination = defineModel<PaginationState>({ required: true })

const totalPages = computed(() => props.table.getPageCount())

const pageSize = computed({
  get() {
    return `${pagination.value.pageSize}`
  },
  set(value) {
    pagination.value = { pageIndex: 0, pageSize: Number(value) }
  },
})
</script>

<template>
  <div class="flex items-center justify-between gap-3 py-2">
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        class="size-9"
        :disabled="!table.getCanPreviousPage()"
        @click="pagination.pageIndex--"
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <span class="text-sm text-muted-foreground tabular-nums">
        {{ pagination.pageIndex + 1 }} / {{ totalPages }}
      </span>
      <Button
        variant="outline"
        size="icon"
        class="size-9"
        :disabled="!table.getCanNextPage()"
        @click="pagination.pageIndex++"
      >
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>

    <Select v-model:model-value="pageSize">
      <SelectTrigger class="h-9 w-auto min-w-16 px-2">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem v-for="size in PAGE_SIZES" :key="size" :value="`${size}`">
          {{ size }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
