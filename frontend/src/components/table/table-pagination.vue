<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, inject } from 'vue'
import { PAGE_SIZES } from './composables/use-pagination'
import { tableInjectionKey } from './table-injection-key'
import type { PaginationState } from '@tanstack/vue-table'

const props = defineProps<{
  totalRecords: number
}>()

const table = inject(tableInjectionKey)!
const pagination = defineModel<PaginationState>({ required: true })

const totalPages = computed(() => {
  return Math.min(
    (pagination.value.pageIndex + 1) * pagination.value.pageSize,
    props.totalRecords,
  )
})

const pageIndex = computed({
  get() {
    return pagination.value.pageIndex + 1
  },
  set(value) {
    const validValue = Math.max(1, Math.min(value, table.getPageCount()))
    pagination.value.pageIndex = validValue - 1
  },
})

const pageSize = computed({
  get() {
    return `${pagination.value.pageSize}`
  },
  set(value) {
    pagination.value = {
      pageIndex: 0,
      pageSize: Number(value),
    }
  },
})

function validateInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = Number.parseInt(input.value)

  if (Number.isNaN(value) || value <= 0) {
    input.value = '1'
    pageIndex.value = 1
  }
}

function handlePageInput() {
  const validValue = Math.max(1, Math.min(pageIndex.value, table.getPageCount()))
  pageIndex.value = validValue
}

function handleBlur() {
  if (pageIndex.value <= 0) {
    pageIndex.value = 1
  }
}
</script>

<template>
  <div class="flex justify-end max-sm:flex-col gap-4">
    <div class="flex gap-2 items-center flex-wrap">
      <div class="flex items-center gap-2 max-sm:justify-end max-sm:w-full flex-wrap">
        <span class="text-muted-foreground text-nowrap">
          Показано с <b>{{ pagination.pageIndex * pagination.pageSize + 1 }}</b> по
          <b>{{ totalPages }}</b> запись из
          <b>{{ totalRecords }}</b>
        </span>
        <Button
          class="size-9 min-w-9 max-sm:w-full"
          variant="outline"
          size="icon"
          :disabled="!table.getCanPreviousPage()"
          @click="pagination.pageIndex--"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Input
          v-model="pageIndex"
          class="w-15 h-9 max-sm:w-full"
          :min="1"
          :max="table.getPageCount()"
          inputmode="numeric"
          type="number"
          @keydown.enter.prevent="handlePageInput"
          @input="validateInput"
          @blur="handleBlur"
        />
        <Button
          class="size-9 min-w-9 max-sm:w-full"
          variant="outline"
          size="icon"
          :disabled="!table.getCanNextPage()"
          @click="pagination.pageIndex++"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
      <div class="flex gap-2 items-center">
        <Select v-model:model-value="pageSize">
          <SelectTrigger class="h-9 w-9 justify-between gap-2">
            <div>
              <SelectValue class="flex-none" />
            </div>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem
              v-for="size in PAGE_SIZES"
              :key="size"
              :value="`${size}`"
            >
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Скрываем стрелки для числового инпута */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield; /* Firefox */
  appearance: textfield; /* Standard property for compatibility */
}
</style>
