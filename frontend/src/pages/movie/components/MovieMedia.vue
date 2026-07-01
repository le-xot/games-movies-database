<script setup lang="ts">
import DataCards from '@/components/media/DataCards.vue'
import Search from '@/components/media/Search.vue'
import { useMovie } from '@/pages/movie/composables/use-movie'
import { useMovieParams } from '@/pages/movie/composables/use-movie-params'

const videos = useMovie()
const params = useMovieParams()
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
    :has-episode-column="false"
    delete-confirm-title="Удалить кинчик?"
    @update="videos.updateRecord"
    @update-poster="videos.updatePoster"
    @delete="videos.deleteRecord"
  />
</template>
