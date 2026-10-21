<script setup lang="ts">
import { RotateCw } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DataCards from '@/components/media/DataCards.vue'
import Search from '@/components/media/Search.vue'
import { Button } from '@/components/ui/button'
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
        hasEpisodeColumn: true,
        deleteConfirmTitle: 'Удалить анимешку?',
      }
    case RecordGenre.CARTOON:
      return {
        records: useCartoon(),
        params: useCartoonParams(),
        hasEpisodeColumn: true,
        deleteConfirmTitle: 'Удалить мультик?',
      }
    case RecordGenre.SERIES:
      return {
        records: useSeries(),
        params: useSeriesParams(),
        hasEpisodeColumn: true,
        deleteConfirmTitle: 'Удалить сирик?',
      }
    case RecordGenre.MOVIE:
      return {
        records: useMovie(),
        params: useMovieParams(),
        hasEpisodeColumn: false,
        deleteConfirmTitle: 'Удалить кинчик?',
      }
    case RecordGenre.GAME:
      return {
        records: useGames(),
        params: useGamesParams(),
        hasEpisodeColumn: false,
        deleteConfirmTitle: 'Удалить игру?',
      }
    default:
      return null
  }
}

const media = ref<ReturnType<typeof createMedia>>(null)

watch(
  () => route.meta.genre,
  (genre) => {
    media.value = genre ? createMedia(genre) : null
  },
  { immediate: true },
)

const items = computed<RecordEntity[]>(() => media.value?.records.items ?? [])
</script>

<template>
  <div v-if="media" class="flex h-full flex-col gap-4">
    <div
      v-if="media.records.error"
      class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[var(--n-action-color)] px-4 py-3"
    >
      <span class="text-sm text-destructive">Не удалось загрузить записи</span>
      <Button variant="outline" size="sm" @click="media.records.retry()">
        <RotateCw class="size-4" />
        Повторить
      </Button>
    </div>

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
      :has-error="!!media.records.error"
      @update="media.records.updateRecord"
      @update-poster="media.records.updatePoster"
      @delete="media.records.deleteRecord"
      @load-more="media.records.loadNextPage"
    />
  </div>
</template>
