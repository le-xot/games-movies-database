<script setup lang="ts">
import DataCards from '@/components/media/DataCards.vue'
import Search from '@/components/media/Search.vue'
import { useAnime } from '@/pages/anime/composables/use-anime'
import { useAnimeParams } from '@/pages/anime/composables/use-anime-params'

const videos = useAnime()
const params = useAnimeParams()
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
    delete-confirm-title="Удалить анимешку?"
    @update="videos.updateRecord"
    @update-poster="videos.updatePoster"
    @delete="videos.deleteRecord"
  />
</template>
