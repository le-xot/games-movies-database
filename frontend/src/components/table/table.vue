<script setup lang="ts">
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { Virtualizer } from 'virtua/vue'
import { ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'

const props = defineProps<{
  isLoading: boolean
  columns: ColumnDef<any>[]
  data: any[]
}>()

const scrollRef = ref<HTMLElement>()

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
  <div ref="scrollRef" class="relative w-full overflow-auto">
    <Table class="rounded-md border w-full h-[80vh] overflow-auto">
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
        <FlexRender
          v-for="cell in item.getVisibleCells()"
          :key="cell.id"
          :render="cell.column.columnDef.cell"
          :props="cell.getContext()"
          :style="{ width: cell.column.getSize() === 0 ? '1000px' : `${cell.column.getSize()}px` }"
        />
      </Virtualizer>
    </Table>
  </div>
</template>
