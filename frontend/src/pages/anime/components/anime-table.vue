<script setup lang="ts">
import Table from '@/components/table/table.vue'
import TablePagination from '@/components/table/table-pagination.vue'
import TableSearch from '@/components/table/table-search.vue'
import { useAnime } from '../composables/use-anime.ts'
import { useAnimeParams } from '../composables/use-anime-params.ts'
import { useAnimeTable } from '../composables/use-anime-table.ts'

const animeStore = useAnime()
const table = useAnimeTable()
const params = useAnimeParams()
</script>

<template>
  <TableSearch
    v-model:value="params.search"
    v-model:column-visibility="params.columnVisibility"
  />

  <Table
    :is-loading="animeStore.isLoading"
    :table="table"
  >
    <template #pagination>
      <TablePagination
        v-model="params.pagination"
        :total-records="animeStore.totalRecords"
      />
    </template>
  </Table>
</template>
