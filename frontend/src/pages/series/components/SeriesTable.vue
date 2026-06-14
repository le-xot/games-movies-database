<script setup lang="ts">
import DataTable from '@/components/table/DataTable.vue'
import TablePagination from '@/components/table/TablePagination.vue'
import TableSearch from '@/components/table/TableSearch.vue'
import { useSeries } from '@/pages/series/composables/use-series'
import { useSeriesParams } from '@/pages/series/composables/use-series-params'
import { useSeriesTable } from '@/pages/series/composables/use-series-table'

const videos = useSeries()
const table = useSeriesTable()
const params = useSeriesParams()
</script>

<template>
  <TableSearch v-model:value="params.search" v-model:column-visibility="params.columnVisibility" />

  <DataTable :is-loading="videos.isLoading" :table="table">
    <template #pagination>
      <TablePagination v-model="params.pagination" :total-records="videos.totalRecords" />
    </template>
  </DataTable>
</template>
