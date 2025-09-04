<script setup lang="ts">
import { genreTags } from '@/components/table/composables/use-table-select'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ui/tag'
import { RecordType } from '@/lib/api'
import { ROUTER_PATHS } from '@/lib/router/router-paths'
import { ListPlus } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import QueueCard from './components/queue-card.vue'
import { useQueue } from './composables/use-queue'

const queue = useQueue()
const router = useRouter()

const filteredGames = computed(() => queue.data?.games?.filter(item => item.type !== RecordType.SUGGESTION) ?? [])
const filteredVideos = computed(() => queue.data?.videos?.filter(item => item.type !== RecordType.SUGGESTION) ?? [])

function navigateToSuggestions() {
  router.push(ROUTER_PATHS.dbSuggestion)
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <QueueCard v-if="filteredGames.length > 0" kind="game" :items="filteredGames">
      <template #title>
        Поиграть: {{ filteredGames.length }}
      </template>
    </QueueCard>

    <QueueCard v-if="filteredVideos.length > 0" kind="video" :items="filteredVideos">
      <template #title>
        Посмотреть: {{ filteredVideos.length }}
      </template>
      <template #footer="{ item }">
        <div>
          <Tag :class="genreTags[item.genre!]!.class">
            {{ genreTags[item.genre!]!.name }}
          </Tag>
        </div>
      </template>
    </QueueCard>

    <div
      v-if="filteredGames.length === 0 && filteredVideos.length === 0"
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
