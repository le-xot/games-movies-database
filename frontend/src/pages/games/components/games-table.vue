<script setup lang="ts">
import Table from '@/components/table/table.vue'
import TableSearch from '@/components/table/table-search.vue'
import { VisibilityState } from '@tanstack/vue-table'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useGames } from '../composables/use-games'
import { useGamesTable } from '../composables/use-games-table'

const { isLoading, games, pagination, totalPages } = storeToRefs(useGames())

const gamesStore = useGames()

const table = useGamesTable()

const columnVisibility = useLocalStorage<VisibilityState>('gamesColumnVisibility', {
  title: true,
  person: true,
  status: true,
  grade: true,
})
</script>

<template>
  <TableSearch
    v-model:value="gamesStore.search"
    v-model:column-visibility="columnVisibility"
  />

  <Table
    :columns="table.tableColumns"
    :data="games"
    :is-loading="isLoading"
    :column-visibility="columnVisibility"
    :pagination="pagination"
    :total-pages="totalPages"
    :total-records="gamesStore.totalRecords"
    @update:pagination="(pagination) => { gamesStore.pagination = pagination }"
  />
</template>
