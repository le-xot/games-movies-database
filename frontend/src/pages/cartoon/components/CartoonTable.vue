<script setup lang="ts">
import DataCards from '@/components/table/DataCards.vue'
import DataTable from '@/components/table/DataTable.vue'
import TablePagination from '@/components/table/TablePagination.vue'
import TableSearch from '@/components/table/TableSearch.vue'
import { useCartoon } from '@/pages/cartoon/composables/use-cartoon'
import { useCartoonParams } from '@/pages/cartoon/composables/use-cartoon-params'
import { useCartoonTable } from '@/pages/cartoon/composables/use-cartoon-table'
import { useBreakpoints } from '@/stores/use-breakpoints'

const videos = useCartoon()
const table = useCartoonTable()
const params = useCartoonParams()
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
      :has-episode-column="true"
      delete-confirm-title="Удалить мультик?"
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
