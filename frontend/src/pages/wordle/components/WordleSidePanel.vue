<script setup lang="ts">
import { Share2 } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WordleGameStatus } from '@/lib/api'
import WordleLeaderboardList from '@/pages/wordle/components/WordleLeaderboardList.vue'
import WordleStats from '@/pages/wordle/components/WordleStats.vue'
import { useWordle } from '@/pages/wordle/composables/use-wordle'
import { useWordleShare } from '@/pages/wordle/composables/use-wordle-share'
import { formatWordleGlobalStats } from '@/pages/wordle/constants/wordle-constants'
import type { WordleLeaderboardMode } from '@/pages/wordle/constants/wordle-constants'

defineProps<{
  countdown: string
  progress: number
}>()

const wordle = useWordle()
const { state, stats, leaderboard } = storeToRefs(wordle)
const { shareResult, isSharing } = useWordleShare()

const mode = ref<WordleLeaderboardMode>('today')

const todayStatus = computed(() => {
  const current = state.value
  if (!current || current.status === WordleGameStatus.IN_PROGRESS) return null

  if (current.status === WordleGameStatus.WON) {
    return `Угадано с ${current.attempts}-й попытки · серия ${stats.value?.currentStreak ?? 0}`
  }
  return `Слово: ${(current.answer ?? '').toUpperCase()}`
})
</script>

<template>
  <aside
    class="hidden max-h-[calc(100dvh-96px)] w-[300px] shrink-0 flex-col gap-4 overflow-y-auto xl:flex"
  >
    <div class="flex flex-col gap-2">
      <span class="text-sm text-muted-foreground">Новое слово через {{ countdown }}</span>
      <div class="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full bg-green-600" :style="{ width: `${progress * 100}%` }" />
      </div>
    </div>

    <div v-if="todayStatus" class="flex items-center justify-between gap-2">
      <div class="flex flex-col gap-0.5">
        <p class="text-xs text-muted-foreground">Результат</p>
        <p class="text-sm font-medium">{{ todayStatus }}</p>
      </div>
      <Button
        variant="secondary"
        size="icon"
        aria-label="Поделиться результатом"
        :disabled="isSharing"
        @click="shareResult"
      >
        <Share2 class="size-4" />
      </Button>
    </div>

    <WordleStats />

    <div>
      <div class="mb-2 flex items-center justify-between gap-2">
        <h3 class="text-xs font-medium uppercase text-muted-foreground">Лидеры</h3>
        <Tabs v-model="mode">
          <TabsList>
            <TabsTrigger value="today">Сегодня</TabsTrigger>
            <TabsTrigger value="wins">Победы</TabsTrigger>
            <TabsTrigger value="streak">Серия</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <WordleLeaderboardList :leaderboard="leaderboard" :mode="mode" compact :limit="5" />

      <p class="mt-2 text-xs text-muted-foreground">{{ formatWordleGlobalStats(leaderboard) }}</p>
    </div>
  </aside>
</template>
