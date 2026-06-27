<script setup lang="ts">
import DataCards from '@/components/table/DataCards.vue'
import TableSearch from '@/components/table/TableSearch.vue'
import { useMovie } from '@/pages/movie/composables/use-movie'
import { useMovieParams } from '@/pages/movie/composables/use-movie-params'

const videos = useMovie()
const params = useMovieParams()
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
    :has-episode-column="false"
    delete-confirm-title="Удалить кинчик?"
    @update="videos.updateRecord"
    @delete="videos.deleteRecord"
  />
</template>
