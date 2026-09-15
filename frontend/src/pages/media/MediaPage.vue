<script setup lang="ts">
import { computed } from 'vue'
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

const anime = useAnime()
const animeParams = useAnimeParams()
const cartoon = useCartoon()
const cartoonParams = useCartoonParams()
const games = useGames()
const gamesParams = useGamesParams()
const movie = useMovie()
const movieParams = useMovieParams()
const series = useSeries()
const seriesParams = useSeriesParams()

const media = computed(() => {
  switch (route.meta.genre as RecordGenre) {
    case RecordGenre.ANIME:
      return {
        records: anime,
        params: animeParams,
        itemsName: 'videos',
        hasEpisodeColumn: true,
        deleteConfirmTitle: 'Удалить анимешку?',
      }
    case RecordGenre.CARTOON:
      return {
        records: cartoon,
        params: cartoonParams,
        itemsName: 'videos',
        hasEpisodeColumn: true,
        deleteConfirmTitle: 'Удалить мультик?',
      }
    case RecordGenre.SERIES:
      return {
        records: series,
        params: seriesParams,
        itemsName: 'videos',
        hasEpisodeColumn: true,
        deleteConfirmTitle: 'Удалить сирик?',
      }
    case RecordGenre.MOVIE:
      return {
        records: movie,
        params: movieParams,
        itemsName: 'videos',
        hasEpisodeColumn: false,
        deleteConfirmTitle: 'Удалить кинчик?',
      }
    case RecordGenre.GAME:
      return {
        records: games,
        params: gamesParams,
        itemsName: 'games',
        hasEpisodeColumn: false,
        deleteConfirmTitle: 'Удалить игру?',
      }
    default:
      return null
  }
})

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
      :has-episode-column="media.hasEpisodeColumn"
      :delete-confirm-title="media.deleteConfirmTitle"
      @update="media.records.updateRecord"
      @update-poster="media.records.updatePoster"
      @delete="media.records.deleteRecord"
    />
  </template>
</template>
