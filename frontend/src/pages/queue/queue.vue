<script setup lang="ts">
import { genreTags } from '@/components/table/composables/use-table-select'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ui/tag'
import Spinner from '@/components/utils/spinner.vue'
import { ROUTER_PATHS } from '@/lib/router/router-paths'
import { useAnime } from '@/pages/anime/composables/use-anime.ts'
import { ListPlus } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGames } from '../games/composables/use-games'
import QueueCard from './components/queue-card.vue'
import { useQueue } from './composables/use-queue'

const games = useGames()
const anime = useAnime()
const queue = useQueue()
const router = useRouter()

const isLoading = computed(() => games.isLoading || anime.isLoading)

function navigateToSuggestions() {
  router.push(ROUTER_PATHS.dbSuggestion)
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <div v-if="isLoading" class="flex items-center justify-center">
      <Spinner />
    </div>
    <QueueCard v-if="(queue.data?.games?.length ?? 0) > 0 && !isLoading" kind="game" :items="queue.data?.games ?? []">
      <template #title>
        Поиграть: {{ queue.data?.games?.length ?? 0 }}
      </template>
    </QueueCard>

    <QueueCard v-if="(queue.data?.videos?.length ?? 0) > 0 && !isLoading" kind="video" :items="queue.data?.videos ?? []">
      <template #title>
        Посмотреть: {{ queue.data?.videos?.length ?? 0 }}
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
      style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
      class="text-center"
    >
      <img class="w-[120px] h-[120px] mx-auto" src="/images/aga.webp" alt="Ага">
      <span class="text-xl font-bold block mt-4">Пока в очереди ничего нет</span>
      <Button class="mt-4" @click="navigateToSuggestions">
        <span class="flex items-center gap-2">
          Перейти к предложениям
          <ListPlus class="icon" />
        </span>
      </Button>
    </div>
  </div>
</template>
