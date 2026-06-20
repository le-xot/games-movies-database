<script setup lang="ts" generic="T extends RowData">
import { FlexRender, RowData, type Cell, Table } from '@tanstack/vue-table'
import { provide } from 'vue'
import { tableInjectionKey } from '@/components/table/table-injection-key'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  Table as TableRoot,
  TableRow,
} from '@/components/ui/table'
import { RecordStatus } from '@/lib/api'

const props = defineProps<{
  isLoading: boolean
  table: Table<T>
}>()

provide(tableInjectionKey, props.table)

function isNotInterested(row: T): boolean {
  return (row as { status?: string })?.status === RecordStatus.NOTINTERESTED
}

function getVisibleCellsForRow(row: { getVisibleCells: () => Cell<T, unknown>[]; original: T }) {
  const cells = row.getVisibleCells()
  if (!isNotInterested(row.original)) return cells

  return cells.filter((cell) => cell.column.id !== 'grade')
}
</script>

<template>
  <slot name="pagination" />

  <div class="w-full rounded-md border">
    <TableRoot>
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
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="max-h-24"
            :data-state="row.getIsSelected() && 'selected'"
          >
            <TableCell
              v-for="cell in getVisibleCellsForRow(row)"
              :key="cell.id"
              :colspan="
                cell.column.id === 'status' && isNotInterested(row.original) ? 2 : undefined
              "
            >
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </TableCell>
          </TableRow>
        </template>

        <TableRow v-else>
          <TableCell :colspan="table.getAllColumns().length" class="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      </TableBody>
    </TableRoot>
  </div>

  <slot name="pagination" />
</template>
