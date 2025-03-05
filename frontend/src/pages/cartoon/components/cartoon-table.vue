<script setup lang="ts">
import Table from '@/components/table/table.vue'
import TablePagination from '@/components/table/table-pagination.vue'
import TableSearch from '@/components/table/table-search.vue'
import { useCartoon } from '../composables/use-cartoon.ts'
import { useCartoonParams } from '../composables/use-cartoon-params.ts'
import { useCartoonTable } from '../composables/use-cartoon-table.ts'

const videos = useCartoon()
const table = useCartoonTable()
const params = useCartoonParams()
</script>

<template>
  <TableSearch
    v-model:value="params.search"
    v-model:column-visibility="params.columnVisibility"
  />

  <Table
    :is-loading="videos.isLoading"
    :table="table"
  >
    <template #pagination>
      <TablePagination
        v-model="params.pagination"
        :total-records="videos.totalRecords"
      />
    </template>
  </Table>
</template>
