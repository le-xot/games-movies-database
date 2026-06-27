<script setup lang="ts">
import DataCards from '@/components/table/DataCards.vue'
import DataTable from '@/components/table/DataTable.vue'
import TablePagination from '@/components/table/TablePagination.vue'
import TableSearch from '@/components/table/TableSearch.vue'
import { useMovie } from '@/pages/movie/composables/use-movie'
import { useMovieParams } from '@/pages/movie/composables/use-movie-params'
import { useMovieTable } from '@/pages/movie/composables/use-movie-table'
import { useBreakpoints } from '@/stores/use-breakpoints'

const videos = useMovie()
const table = useMovieTable()
const params = useMovieParams()
const breakpoints = useBreakpoints()
</script>

<template>
  <TableSearch v-model:value="params.search" v-model:column-visibility="params.columnVisibility" />

  <template v-if="breakpoints.isDesktop">
    <DataTable :is-loading="videos.isLoading" :table="table">
      <template #pagination>
        <TablePagination
          v-model="params.pagination"
          :total-records="videos.totalRecords"
          :table="table"
        />
      </template>
    </DataTable>
  </template>

  <template v-else>
    <TablePagination
      v-model="params.pagination"
      :total-records="videos.totalRecords"
      :table="table"
    />

    <DataCards
      :items="videos.videos ?? []"
      :is-loading="videos.isLoading"
      :has-episode-column="false"
      delete-confirm-title="Удалить кинчик?"
      @update="videos.updateRecord"
      @delete="videos.deleteRecord"
    />

    <TablePagination
      v-model="params.pagination"
      :total-records="videos.totalRecords"
      :table="table"
    />
  </template>
</template>
