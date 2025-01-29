<script setup lang="ts">
import { genreTags } from '@/components/table/composables/use-table-select'
import { Tag } from '@/components/ui/tag'
import Spinner from '@/components/utils/spinner.vue'
import { computed } from 'vue'
import { useGames } from '../games/composables/use-games'
import { useVideos } from '../videos/composables/use-videos'
import QueueCard from './components/queue-card.vue'
import { useQueue } from './composables/use-queue'

const games = useGames()
const videos = useVideos()
const queue = useQueue()
const isLoading = computed(() => games.isLoading || videos.isLoading)
</script>

<template>
  <div class="queue">
    <div v-if="isLoading" class="loaded">
      <Spinner />
    </div>
    <QueueCard v-if="queue.data?.games.length > 0 && !isLoading" kind="game" :items="queue.data?.games ?? []">
      <template #title>
        Поиграть: {{ queue.data?.games.length }}
      </template>
    </QueueCard>

    <QueueCard v-if="queue.data?.videos.length > 0 && !isLoading" kind="video" :items="queue.data?.videos ?? []">
      <template #title>
        Посмотреть: {{ videos.totalRecords }}
      </template>
      <template #footer="{ item }">
        <div>
          <Tag :class="genreTags[item.genre].class">
            {{ genreTags[item.genre].name }}
          </Tag>
        </div>
      </template>
    </QueueCard>

    <div
      v-if="queue.data?.games.length === 0 && queue.data.videos.length === 0 && !isLoading"
      class="aga"
    >
      <img class="aga__img" src="/images/aga.webp" alt="Ага">
      <span class="aga__text">Пока в очереди ничего нет</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.queue {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: inherit;
}

.aga {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 16px;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &__img {
    width: 120px;
    height: 120px;
  }

  &__text {
    font-size: 20px;
    font-weight: 700;
  }
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
