<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ErrorRetry from '@/components/feedback/ErrorRetry.vue'
import DataCards from '@/components/media/DataCards.vue'
import Search from '@/components/media/Search.vue'
import {
  GENRE_REGISTRY,
  type GenreEntry,
  type GenreParamsStore,
  type GenreRecordsStore,
} from '@/lib/genre-registry'
import { GENRE_STORES } from '@/pages/media/genre-stores'

const route = useRoute()

interface GenreMedia {
  entry: GenreEntry
  records: GenreRecordsStore
  params: GenreParamsStore
}

/**
 * Жанровая страница — одна для пяти разделов: метаданные берутся из реестра,
 * сторы — из карты жанров. Сторы создаются в `watch(immediate)`, то есть в setup:
 * colada вешает lifecycle-хуки стора, и вызывать их из `computed` (во время
 * рендера) нельзя — запрос тогда не стартует.
 */
const media = ref<GenreMedia | null>(null)

watch(
  () => route.meta.genre,
  (genre) => {
    if (!genre) {
      media.value = null
      return
    }

    const stores = GENRE_STORES[genre]
    media.value = {
      entry: GENRE_REGISTRY[genre],
      records: stores.useRecords(),
      params: stores.useParams(),
    }
  },
  { immediate: true },
)

const items = computed(() => media.value?.records.items ?? [])
</script>

<template>
  <div v-if="media" class="flex h-full flex-col gap-4">
    <ErrorRetry
      v-if="media.records.error"
      message="Не удалось загрузить записи"
      @retry="media.records.retry()"
    />

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
      :has-episode-column="media.entry.hasEpisodeColumn"
      :delete-confirm-title="media.entry.deleteConfirmTitle"
      :has-error="!!media.records.error"
      @update="media.records.updateRecord"
      @update-poster="media.records.updatePoster"
      @delete="media.records.deleteRecord"
      @load-more="media.records.loadNextPage"
    />
  </div>
</template>
