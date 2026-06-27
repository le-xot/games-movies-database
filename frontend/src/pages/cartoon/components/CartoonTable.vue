<script setup lang="ts">
import DataCards from '@/components/table/DataCards.vue'
import TableSearch from '@/components/table/TableSearch.vue'
import { useCartoon } from '@/pages/cartoon/composables/use-cartoon'
import { useCartoonParams } from '@/pages/cartoon/composables/use-cartoon-params'

const videos = useCartoon()
const params = useCartoonParams()
</script>

<template>
  <TableSearch
    v-model:value="params.search"
    :statuses-filter="params.statusesFilter"
    :grade-filter="params.gradeFilter"
    @update:statuses-filter="params.setStatusFilter"
    @update:grade-filter="params.setGradeFilter"
  />

  <DataCards
    :items="videos.videos ?? []"
    :is-loading="videos.isLoading"
    :has-episode-column="true"
    delete-confirm-title="Удалить мультик?"
    @update="videos.updateRecord"
    @delete="videos.deleteRecord"
  />
</template>
