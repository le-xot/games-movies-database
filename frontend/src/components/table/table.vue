<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FlexRender, getCoreRowModel, getPaginationRowModel, useVueTable } from '@tanstack/vue-table'
import TablePagination from './table-pagination.vue'
import type { ColumnDef, PaginationState } from '@tanstack/vue-table'

const props = defineProps<{
  isLoading: boolean
  columns: ColumnDef<any>[]
  columnVisibility: Record<string, boolean>
  data: any[]
  pagination: PaginationState
  totalPages: number
  totalRecords: number
}>()

defineEmits<{ 'update:pagination': [PaginationState] }>()

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  get pageCount() {
    return props.totalPages
  },
  state: {
    get columnVisibility() {
      return props.columnVisibility
    },
    get pagination() {
      return props.pagination
    },
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  manualPagination: true,
})
</script>

<template>
  <div
    class="relative w-full overflow-auto rounded-md border h-full"
  >
    <Table>
      <TableHeader class="w-full">
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :style="{ width: `${header.column.getSize()}%` }"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <template v-if="table.getRowModel().rows?.length">
          <TableRow v-for="row in table.getRowModel().rows" :key="row.id" class="max-h-24" :data-state="row.getIsSelected() && 'selected'">
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender
                v-if="cell.column.getIsVisible()"
                :style="{ width: `${cell.column.getSize()}%` }"
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
        </template>

        <TableRow v-else>
          <TableCell
            :colspan="columns.length"
            class="h-24 text-center"
          >
            No results.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>

  <TablePagination
    :total="totalRecords"
    :table="table"
    :pagination="pagination"
    @update:page="(pageIndex) => { $emit('update:pagination', { ...pagination, pageIndex }) }"
    @update:page-size="(pageSize) => { $emit('update:pagination', { ...pagination, pageSize }) }"
  />
</template>
