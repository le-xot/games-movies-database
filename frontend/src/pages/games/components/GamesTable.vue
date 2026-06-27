<script setup lang="ts">
import DataCards from '@/components/table/DataCards.vue'
import DataTable from '@/components/table/DataTable.vue'
import TablePagination from '@/components/table/TablePagination.vue'
import TableSearch from '@/components/table/TableSearch.vue'
import { useGames } from '@/pages/games/composables/use-games'
import { useGamesParams } from '@/pages/games/composables/use-games-params'
import { useGamesTable } from '@/pages/games/composables/use-games-table'
import { useBreakpoints } from '@/stores/use-breakpoints'

const games = useGames()
const table = useGamesTable()
const params = useGamesParams()
const breakpoints = useBreakpoints()
</script>

<template>
  <TableSearch v-model:value="params.search" v-model:column-visibility="params.columnVisibility" />

  <template v-if="breakpoints.isDesktop">
    <DataTable :is-loading="games.isLoading" :table="table">
      <template #pagination>
        <TablePagination
          v-model="params.pagination"
          :total-records="games.totalRecords"
          :table="table"
        />
      </template>
    </DataTable>
  </template>

  <template v-else>
    <TablePagination
      v-model="params.pagination"
      :total-records="games.totalRecords"
      :table="table"
    />

    <DataCards
      :items="games.games ?? []"
      :is-loading="games.isLoading"
      :has-episode-column="false"
      delete-confirm-title="Удалить игру?"
      @update="games.updateRecord"
      @delete="games.deleteRecord"
    />

    <TablePagination
      v-model="params.pagination"
      :total-records="games.totalRecords"
      :table="table"
    />
  </template>
</template>
