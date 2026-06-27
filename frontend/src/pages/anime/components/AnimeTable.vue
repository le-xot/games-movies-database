<script setup lang="ts">
import DataCards from '@/components/table/DataCards.vue'
import TableSearch from '@/components/table/TableSearch.vue'
import { useAnime } from '@/pages/anime/composables/use-anime'
import { useAnimeParams } from '@/pages/anime/composables/use-anime-params'

const videos = useAnime()
const params = useAnimeParams()
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
    delete-confirm-title="Удалить анимешку?"
    @update="videos.updateRecord"
    @delete="videos.deleteRecord"
  />
</template>
