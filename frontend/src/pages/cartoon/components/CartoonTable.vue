<script setup lang="ts">
import DataTable from '@/components/table/DataTable.vue'
import TablePagination from '@/components/table/TablePagination.vue'
import TableSearch from '@/components/table/TableSearch.vue'
import { useCartoon } from '../composables/use-cartoon'
import { useCartoonParams } from '../composables/use-cartoon-params'
import { useCartoonTable } from '../composables/use-cartoon-table'

const videos = useCartoon()
const table = useCartoonTable()
const params = useCartoonParams()
</script>

<template>
  <TableSearch v-model:value="params.search" v-model:column-visibility="params.columnVisibility" />

  <DataTable :is-loading="videos.isLoading" :table="table">
    <template #pagination>
      <TablePagination v-model="params.pagination" :total-records="videos.totalRecords" />
    </template>
  </DataTable>
</template>
