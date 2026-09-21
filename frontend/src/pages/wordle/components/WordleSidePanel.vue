<script setup lang="ts">
import { Share2 } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WordleGameStatus } from '@/lib/api'
import WordleLeaderboardList from '@/pages/wordle/components/WordleLeaderboardList.vue'
import { useWordle } from '@/pages/wordle/composables/use-wordle'
import { useWordleShare } from '@/pages/wordle/composables/use-wordle-share'
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

const statItems = computed(() => [
  { label: 'Играно', value: stats.value?.played ?? 0 },
  { label: 'Победы', value: stats.value?.wins ?? 0 },
  { label: '%', value: stats.value?.winRate ?? 0 },
  { label: 'Серия', value: stats.value?.currentStreak ?? 0 },
  { label: 'Макс', value: stats.value?.maxStreak ?? 0 },
])

const distribution = computed(() => {
  const counts = stats.value?.distribution ?? []
  const max = Math.max(1, ...counts)
  return counts.map((count, index) => ({
    attempt: index + 1,
    count,
    width: count === 0 ? 0 : Math.max(8, Math.round((count / max) * 100)),
  }))
})

const distributionTotal = computed(() =>
  (stats.value?.distribution ?? []).reduce((sum, value) => sum + value, 0),
)

const globalStats = computed(
  () =>
    `Игроков ${leaderboard.value?.totalPlayers ?? 0} · Игр ${leaderboard.value?.totalGames ?? 0} · Побед сегодня ${leaderboard.value?.winsToday ?? 0}`,
)
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

    <div>
      <h3 class="mb-2 text-xs font-medium uppercase text-muted-foreground">Моя статистика</h3>
      <div class="grid grid-cols-5 gap-2">
        <div v-for="item in statItems" :key="item.label" class="text-center">
          <div class="text-lg font-bold leading-tight">{{ item.value }}</div>
          <div class="text-[10px] leading-tight text-muted-foreground">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div>
      <h3 class="mb-2 text-xs font-medium uppercase text-muted-foreground">
        Распределение попыток
      </h3>
      <ul v-if="distributionTotal > 0" class="flex flex-col gap-1">
        <li v-for="item in distribution" :key="item.attempt" class="flex items-center gap-2">
          <span class="w-3 text-xs text-muted-foreground">{{ item.attempt }}</span>
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-green-600" :style="{ width: `${item.width}%` }" />
          </div>
          <span class="w-4 text-right text-xs text-muted-foreground">{{ item.count }}</span>
        </li>
      </ul>
      <p v-else class="text-xs text-muted-foreground">Пока нет победных партий</p>
    </div>

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

      <p class="mt-2 text-xs text-muted-foreground">{{ globalStats }}</p>
    </div>
  </aside>
</template>
