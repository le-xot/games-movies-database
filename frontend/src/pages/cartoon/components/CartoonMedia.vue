<script setup lang="ts">
import DataCards from '@/components/media/DataCards.vue'
import Search from '@/components/media/Search.vue'
import { useCartoon } from '@/pages/cartoon/composables/use-cartoon'
import { useCartoonParams } from '@/pages/cartoon/composables/use-cartoon-params'

const videos = useCartoon()
const params = useCartoonParams()
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
    delete-confirm-title="Удалить мультик?"
    @update="videos.updateRecord"
    @update-poster="videos.updatePoster"
    @delete="videos.deleteRecord"
  />
</template>
