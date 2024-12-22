<script setup lang="ts">
import { genreTags } from '@/components/table/composables/use-table-select'
import { Tag } from '@/components/ui/tag'
import Spinner from '@/components/utils/spinner.vue'
import { computed } from 'vue'
import { useGames } from '../games/composables/use-games'
import { useVideos } from '../videos/composables/use-videos'
import QueueCard from './components/queue-card.vue'

const games = useGames()
const videos = useVideos()
const isLoading = computed(() => games.isLoading || videos.isLoading)
</script>

<template>
  <div class="queue">
    <div v-if="isLoading" class="loaded">
      <Spinner />
    </div>
    <QueueCard v-if="games.gamesQueue.length > 0 && !isLoading" kind="game" :items="games.gamesQueue">
      <template #title>
        Поиграть: {{ games.gamesQueue.length }}
      </template>
    </QueueCard>

    <QueueCard v-if="videos.videosQueue.length > 0" kind="video" :items="videos.videosQueue">
      <template #title>
        Посмотреть: {{ videos.videosQueue.length }}
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
      v-if="videos.videosQueue.length === 0 && games.gamesQueue.length === 0 && !isLoading"
      class="empty"
    >
      Пока в очереди ничего нет :C
    </div>
  </div>
</template>

<style scoped>
.queue {
  margin: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty {
  width: 100%;
  height: 100dvh;
  display: flex;
  font-size: 100px;
  justify-content: center;
  align-content: center;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: column;
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
