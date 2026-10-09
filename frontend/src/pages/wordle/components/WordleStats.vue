<script setup lang="ts">
import { Trophy } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import WordleActivityWeek from '@/pages/wordle/components/WordleActivityWeek.vue'
import { useWordle } from '@/pages/wordle/composables/use-wordle'

const { stats } = storeToRefs(useWordle())

const tiles = computed(() => [
  { label: 'Сыграно', value: stats.value?.played ?? 0, accent: '' },
  { label: 'Побед', value: stats.value?.wins ?? 0, accent: 'text-green-500' },
  { label: 'Серия', value: stats.value?.currentStreak ?? 0, accent: '' },
  { label: 'Макс', value: stats.value?.maxStreak ?? 0, accent: '' },
])

const history = computed(() => stats.value?.history ?? [])
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h3 class="mb-2 text-xs font-medium uppercase text-muted-foreground">Моя статистика</h3>
      <div class="grid grid-cols-4 gap-2">
        <div
          v-for="tile in tiles"
          :key="tile.label"
          class="flex flex-col items-center justify-center gap-0.5 rounded-md border border-white/10 bg-white/5 py-3"
        >
          <span :class="['text-xl font-bold leading-none', tile.accent]">{{ tile.value }}</span>
          <span class="text-[10px] uppercase tracking-wide text-muted-foreground">
            {{ tile.label }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="stats?.rank" class="flex justify-end">
      <span
        class="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400"
      >
        <Trophy class="size-3" /> №{{ stats.rank }} из {{ stats.totalPlayers }}
      </span>
    </div>

    <div>
      <h3 class="mb-2 text-xs font-medium uppercase text-muted-foreground">Активность · 7 дней</h3>
      <WordleActivityWeek :history="history" />
    </div>
  </div>
</template>
