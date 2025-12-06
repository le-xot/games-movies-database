<script setup lang="ts">
import Table from "@/components/table/table.vue"
import TablePagination from "@/components/table/table-pagination.vue"
import TableSearch from "@/components/table/table-search.vue"
import { useMovie } from "../composables/use-movie.ts"
import { useMovieParams } from "../composables/use-movie-params.ts"
import { useMovieTable } from "../composables/use-movie-table.ts"

const videos = useMovie()
const table = useMovieTable()
const params = useMovieParams()
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
