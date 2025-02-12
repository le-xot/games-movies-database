<script setup lang="ts">
import Table from '@/components/table/table.vue'
import TablePagination from '@/components/table/table-pagination.vue'
import TableSearch from '@/components/table/table-search.vue'
import { useVideos } from '../composables/use-videos'
import { useVideosParams } from '../composables/use-videos-params'
import { useVideosTable } from '../composables/use-videos-table'

const videos = useVideos()
const table = useVideosTable()
const params = useVideosParams()
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
