<script setup lang="ts">
import TablePagination from '@/components/table/TablePagination.vue';
import TableSearch from '@/components/table/TableSearch.vue';
import DataTable from '@/components/table/DataTable.vue';
import { useGames } from '../composables/use-games';
import { useGamesParams } from '../composables/use-games-params';
import { useGamesTable } from '../composables/use-games-table';

const games = useGames();
const table = useGamesTable();
const params = useGamesParams();
</script>

<template>
  <TableSearch v-model:value="params.search" v-model:column-visibility="params.columnVisibility" />

  <DataTable :is-loading="games.isLoading" :table="table">
    <template #pagination>
      <TablePagination v-model="params.pagination" :total-records="games.totalRecords" />
    </template>
  </DataTable>
</template>
