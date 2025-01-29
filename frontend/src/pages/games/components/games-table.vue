<script setup lang="ts">
import Table from '@/components/table/table.vue'
import TableSearch from '@/components/table/table-search.vue'

import { storeToRefs } from 'pinia'
import { useGames } from '../composables/use-games'
import { useGamesTable } from '../composables/use-games-table'

const { isLoading, games, pagination, totalPages } = storeToRefs(useGames())

const gamesStore = useGames()

const table = useGamesTable()
</script>

<template>
  <TableSearch
    v-model:value="table.search.searchValue"
    v-model:column-visibility="table.columnVisibility"
  />
  <Table
    :columns="table.tableColumns"
    :data="games"
    :is-loading="isLoading"
    :column-visibility="table.columnVisibility"
    :pagination="pagination"
    :total-pages="totalPages"
    :total-records="gamesStore.totalRecords"
    @update:pagination="(pagination) => { gamesStore.pagination = pagination }"
  />
</template>
