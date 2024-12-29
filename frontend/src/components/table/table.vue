<script setup lang="ts">
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useBreakpoints } from '@/composables/use-breakpoints'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { Virtualizer } from 'virtua/vue'
import { ref } from 'vue'
import { Card } from '../ui/card'
import type { ColumnDef } from '@tanstack/vue-table'

const props = defineProps<{
  isLoading: boolean
  columns: ColumnDef<any>[]
  columnVisibility: Record<string, boolean>
  data: any[]
}>()

const breakpoints = useBreakpoints()
const scrollRef = ref<HTMLElement>()

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
  },
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <div
    v-if="breakpoints.isDesktop"
    ref="scrollRef"
    class="relative w-full overflow-auto rounded-md border"
  >
    <Table class="w-full h-[83dvh] overflow-auto">
      <TableHeader class="w-full">
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :style="{ width: `${header.column.getSize()}px` }"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <Virtualizer
        v-slot="{ item }"
        :scroll-ref="scrollRef"
        :data="table.getRowModel().rows"
        :item-size="52"
        as="tbody"
        item="tr"
        class="[&_tr:last-child]:border-0"
        :start-margin="42"
        :item-props="() => ({
          class: 'w-full border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        })"
      >
        <template
          v-for="cell in item.getVisibleCells()"
          :key="cell.id"
        >
          <FlexRender
            v-if="cell.column.getIsVisible()"
            :render="cell.column.columnDef.cell"
            :props="cell.getContext()"
            :style="{ width: cell.column.getSize() === 0 ? '1000px' : `${cell.column.getSize()}px` }"
          />
        </template>
      </Virtualizer>
    </Table>
  </div>
  <div v-else class="relative w-full overflow-auto">
    <div class="grid grid-cols-1 gap-4">
      <Card v-for="row in table.getRowModel().rows" :key="row.id">
        <template
          v-for="cell in row.getVisibleCells()"
          :key="cell.id"
        >
          <div v-if="cell.column.id !== 'id'" class="flex flex-col w-full px-4 py-2 border-b last:border-0">
            <FlexRender :render="cell.column.columnDef.header" />
            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </div>
          <div v-else class="flex justify-end border-b">
            <FlexRender
              :render="cell.column.columnDef.cell"
              :props="cell.getContext()"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
