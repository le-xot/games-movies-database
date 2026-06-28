<script setup lang="ts">
import DataCards from '@/components/media/DataCards.vue'
import Search from '@/components/media/Search.vue'
import { useSeries } from '@/pages/series/composables/use-series'
import { useSeriesParams } from '@/pages/series/composables/use-series-params'

const videos = useSeries()
const params = useSeriesParams()
</script>

<template>
  <Search
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
    delete-confirm-title="Удалить сирик?"
    @update="videos.updateRecord"
    @delete="videos.deleteRecord"
  />
</template>
