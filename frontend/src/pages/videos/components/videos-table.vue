<script setup lang="ts">
import Table from '@/components/table/table.vue'
import TableSearch from '@/components/table/table-search.vue'
import { VisibilityState } from '@tanstack/vue-table'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useVideos } from '../composables/use-videos'
import { useVideosTable } from '../composables/use-videos-table'

const { isLoading, videos, pagination, totalPages } = storeToRefs(useVideos())

const videosStore = useVideos()

const table = useVideosTable()

const columnVisibility = useLocalStorage<VisibilityState>('videosColumnVisibility', {
  title: true,
  genre: true,
  person: true,
  status: true,
  grade: true,
})
</script>

<template>
  <TableSearch
    v-model:value="videosStore.search"
    v-model:column-visibility="columnVisibility"
  />
  <Table
    :columns="table.tableColumns"
    :data="videos"
    :is-loading="isLoading"
    :column-visibility="columnVisibility"
    :pagination="pagination"
    :total-pages="totalPages"
    :total-records="videosStore.totalRecords"
    @update:pagination="(pagination) => { videosStore.pagination = pagination }"
  />
</template>
