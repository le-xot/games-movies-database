<script setup lang="ts">
import Table from '@/components/table/table.vue'
import TableSearch from '@/components/table/table-search.vue'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from '@/components/ui/pagination'
import { storeToRefs } from 'pinia'
import { useGames } from '../composables/use-games'
import { useGamesTable } from '../composables/use-games-table'

const { isLoading, games, pagination, totalPages } = storeToRefs(useGames())

const gamesStore = useGames()

const table = useGamesTable()

function handlePageChange(page: number) {
  gamesStore.setPagination({ pageIndex: page - 1, pageSize: pagination.value.pageSize })
}
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
    @update:pagination="handlePageChange"
  />
  <Pagination
    v-slot="{ page }"
    :items-per-page="pagination.pageSize"
    :total="totalPages * pagination.pageSize"
    show-edges
    :default-page="pagination.pageIndex + 1"
    @update:page="handlePageChange"
  >
    <PaginationList v-slot="{ items }" class="flex items-center gap-1">
      <PaginationFirst @click="handlePageChange(1)" />
      <PaginationPrev @click="handlePageChange(Math.max(1, page - 1))" />

      <template v-for="(item, index) in items" :key="index">
        <PaginationListItem
          v-if="item.type === 'page'"
          :value="item.value"
          as-child
        >
          <Button
            class="w-9 h-9 p-0"
            :variant="item.value === page ? 'default' : 'outline'"
            @click="handlePageChange(item.value)"
          >
            {{ item.value }}
          </Button>
        </PaginationListItem>
        <PaginationEllipsis v-else :index="index" />
      </template>

      <PaginationNext @click="handlePageChange(Math.min(totalPages, page + 1))" />
      <PaginationLast @click="handlePageChange(totalPages)" />
    </PaginationList>
  </Pagination>
</template>
