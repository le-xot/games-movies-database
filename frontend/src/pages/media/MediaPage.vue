<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DataCards from '@/components/media/DataCards.vue'
import Search from '@/components/media/Search.vue'
import { RecordGenre, type RecordEntity } from '@/lib/api'
import { useAnime } from '@/pages/anime/composables/use-anime'
import { useAnimeParams } from '@/pages/anime/composables/use-anime-params'
import { useCartoon } from '@/pages/cartoon/composables/use-cartoon'
import { useCartoonParams } from '@/pages/cartoon/composables/use-cartoon-params'
import { useGames } from '@/pages/games/composables/use-games'
import { useGamesParams } from '@/pages/games/composables/use-games-params'
import { useMovie } from '@/pages/movie/composables/use-movie'
import { useMovieParams } from '@/pages/movie/composables/use-movie-params'
import { useSeries } from '@/pages/series/composables/use-series'
import { useSeriesParams } from '@/pages/series/composables/use-series-params'

const route = useRoute()

function createMedia(genre: RecordGenre) {
  switch (genre) {
    case RecordGenre.ANIME:
      return {
        records: useAnime(),
        params: useAnimeParams(),
        itemsName: 'videos',
        hasEpisodeColumn: true,
        deleteConfirmTitle: 'Удалить анимешку?',
      }
    case RecordGenre.CARTOON:
      return {
        records: useCartoon(),
        params: useCartoonParams(),
        itemsName: 'videos',
        hasEpisodeColumn: true,
        deleteConfirmTitle: 'Удалить мультик?',
      }
    case RecordGenre.SERIES:
      return {
        records: useSeries(),
        params: useSeriesParams(),
        itemsName: 'videos',
        hasEpisodeColumn: true,
        deleteConfirmTitle: 'Удалить сирик?',
      }
    case RecordGenre.MOVIE:
      return {
        records: useMovie(),
        params: useMovieParams(),
        itemsName: 'videos',
        hasEpisodeColumn: false,
        deleteConfirmTitle: 'Удалить кинчик?',
      }
    case RecordGenre.GAME:
      return {
        records: useGames(),
        params: useGamesParams(),
        itemsName: 'games',
        hasEpisodeColumn: false,
        deleteConfirmTitle: 'Удалить игру?',
      }
    default:
      return null
  }
}

const media = ref<ReturnType<typeof createMedia>>(null)

watch(
  () => route.meta.genre as RecordGenre | undefined,
  (genre) => {
    media.value = genre ? createMedia(genre) : null
  },
  { immediate: true },
)

const items = computed<RecordEntity[]>(() => {
  if (!media.value) return []
  return ((media.value.records as any)[media.value.itemsName] ?? []) as RecordEntity[]
})
</script>

<template>
  <template v-if="media">
    <Search
      v-model:value="media.params.search"
      :statuses-filter="media.params.statusesFilter"
      :grade-filter="media.params.gradeFilter"
      @update:statuses-filter="media.params.setStatusFilter"
      @update:grade-filter="media.params.setGradeFilter"
    />

    <DataCards
      :items="items"
      :is-loading="media.records.isLoading"
      :is-loading-next="media.records.isLoadingNext"
      :has-next-page="media.records.hasNextPage"
      :has-episode-column="media.hasEpisodeColumn"
      :delete-confirm-title="media.deleteConfirmTitle"
      @update="media.records.updateRecord"
      @update-poster="media.records.updatePoster"
      @delete="media.records.deleteRecord"
      @load-more="media.records.loadNextPage"
    />
  </template>
</template>
