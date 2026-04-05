<script setup lang="ts">
import DataTable from '@/components/table/DataTable.vue'
import TablePagination from '@/components/table/TablePagination.vue'
import TableSearch from '@/components/table/TableSearch.vue'
import { useAnime } from '@/pages/anime/composables/use-anime'
import { useAnimeParams } from '@/pages/anime/composables/use-anime-params'
import { useAnimeTable } from '@/pages/anime/composables/use-anime-table'

const videos = useAnime()
const table = useAnimeTable()
const params = useAnimeParams()
</script>

<template>
  <TableSearch v-model:value="params.search" v-model:column-visibility="params.columnVisibility" />

  <DataTable :is-loading="videos.isLoading" :table="table">
    <template #pagination>
      <TablePagination v-model="params.pagination" :total-records="videos.totalRecords" />
    </template>
  </DataTable>
</template>
