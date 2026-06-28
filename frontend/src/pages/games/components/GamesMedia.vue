<script setup lang="ts">
import DataCards from '@/components/media/DataCards.vue'
import Search from '@/components/media/Search.vue'
import { useGames } from '@/pages/games/composables/use-games'
import { useGamesParams } from '@/pages/games/composables/use-games-params'

const games = useGames()
const params = useGamesParams()
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
    :items="games.games ?? []"
    :is-loading="games.isLoading"
    :has-episode-column="false"
    delete-confirm-title="Удалить игру?"
    @update="games.updateRecord"
    @delete="games.deleteRecord"
  />
</template>
