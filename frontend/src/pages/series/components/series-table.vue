<script setup lang="ts">
import Table from "@/components/table/table.vue"
import TablePagination from "@/components/table/table-pagination.vue"
import TableSearch from "@/components/table/table-search.vue"
import { useSeries } from "../composables/use-series.ts"
import { useSeriesParams } from "../composables/use-series-params.ts"
import { useSeriesTable } from "../composables/use-series-table.ts"

const videos = useSeries()
const table = useSeriesTable()
const params = useSeriesParams()
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
