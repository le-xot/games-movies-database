<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useBreakpoints } from '@/composables/use-breakpoints'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import type { ColumnDef } from '@tanstack/vue-table'

const props = defineProps<{
  isLoading: boolean
  columns: ColumnDef<any>[]
  columnVisibility: Record<string, boolean>
  data: any[]
  pagination: { pageIndex: number, pageSize: number }
  totalPages: number
}>()

const emit = defineEmits(['update:pagination'])

const breakpoints = useBreakpoints()

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
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
  onPaginationChange: (updater) => {
    const newPagination = typeof updater === 'function' ? updater(props.pagination) : updater
    emit('update:pagination', newPagination)
  },
  manualPagination: true,
})
</script>

<template>
  <div
    v-if="breakpoints.isDesktop"
    class="relative w-full overflow-auto rounded-md border"
  >
    <Table class="w-full h-[82dvh] overflow-auto">
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
          <template v-for="row in table.getRowModel().rows" :key="row.id">
            <TableRow :data-state="row.getIsSelected() && 'selected'">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :style="{ width: `${cell.column.getSize()}%` }"
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
            <TableRow v-if="row.getIsExpanded()">
              <TableCell :colspan="row.getAllCells().length">
                {{ JSON.stringify(row.original) }}
              </TableCell>
            </TableRow>
          </template>
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
</template>
