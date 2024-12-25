<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import type { ColumnDef } from '@tanstack/vue-table'

const props = defineProps<{
  isLoading: boolean
  columns: ColumnDef<any>[]
  data: any[]
}>()

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  getCoreRowModel: getCoreRowModel(),
},
)
</script>

<template>
  <Table class="rounded-md border">
    <TableHeader>
      <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
        <TableHead v-for="header in headerGroup.headers" :key="header.id">
          <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <template v-if="table.getRowModel().rows?.length">
        <template v-for="row in table.getRowModel().rows" :key="row.id">
          <TableRow :data-state="row.getIsSelected() && 'selected'">
            <template v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </template>
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
</template>

<!-- <script setup lang="ts">
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { Virtualizer } from 'virtua/vue'
import { ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'

const props = defineProps<{
  isLoading: boolean
  columns: ColumnDef<any>[]
  data: any[]
}>()

const COLUMN_WIDTHS = [200, 400, 200, 200, 200]

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  getCoreRowModel: getCoreRowModel(),
})

const scrollRef = ref<HTMLElement>()

const rowHeight = 48
const headerHeight = 40
</script>

<template>
  <div
    ref="scrollRef" :style="{
      height: '80vh',
      overflow: 'auto',
    }"
  >
    <Table class="rounded-md border">
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <Virtualizer
        v-slot="{ item: row }"
        :scroll-ref="scrollRef"
        :data="table.getRowModel().rows"
        :item-size="rowHeight"
        :start-margin="headerHeight"
        as="tbody"
        item="tr"
      >
        <template v-for="(cell, index) in row.getVisibleCells()" :key="cell.id">
          <FlexRender :style="{ width: `${COLUMN_WIDTHS[index]}px` }" :render="cell.column.columnDef.cell" :props="cell.getContext()" />
        </template>
      </Virtualizer>
    </Table>
  </div>
</template> -->
