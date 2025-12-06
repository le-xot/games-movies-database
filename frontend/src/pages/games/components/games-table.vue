<script setup lang="ts">
import Table from "@/components/table/table.vue"
import TablePagination from "@/components/table/table-pagination.vue"
import TableSearch from "@/components/table/table-search.vue"
import { useGames } from "../composables/use-games"
import { useGamesParams } from "../composables/use-games-params"
import { useGamesTable } from "../composables/use-games-table"

const games = useGames()
const table = useGamesTable()
const params = useGamesParams()
</script>

<template>
  <TableSearch
    v-model:value="params.search"
    v-model:column-visibility="params.columnVisibility"
  />

  <Table
    :is-loading="games.isLoading"
    :table="table"
  >
    <template #pagination>
      <TablePagination
        v-model="params.pagination"
        :total-records="games.totalRecords"
      />
    </template>
  </Table>
</template>
