<script setup lang="ts">
import { WordleHistoryStatus } from '@/lib/api'
import type { WordleHistoryDayDTO } from '@/lib/api'

defineProps<{ history: WordleHistoryDayDTO[] }>()

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const LABELS: Record<WordleHistoryStatus, string> = {
  [WordleHistoryStatus.WON]: 'победа',
  [WordleHistoryStatus.LOST]: 'проигрыш',
  [WordleHistoryStatus.NONE]: 'пропуск',
}

function weekday(date: string): string {
  return WEEKDAYS[new Date(date).getUTCDay()] ?? ''
}

function cellClass(status: WordleHistoryStatus): string {
  if (status === WordleHistoryStatus.WON) return 'bg-green-600'
  if (status === WordleHistoryStatus.LOST) return 'bg-zinc-600'
  return 'bg-white/5'
}
</script>

<template>
  <!-- Скользящие последние 7 дней: сегодня — последняя клетка, отмечена точкой под подписью. -->
  <div class="flex justify-center gap-1">
    <div
      v-for="(day, index) in history"
      :key="day.date"
      class="flex w-8 flex-col items-center gap-1"
    >
      <span
        :title="`${day.date} · ${LABELS[day.status]}`"
        :class="['size-8 rounded-md', cellClass(day.status)]"
      />
      <span class="text-[10px] text-muted-foreground">{{ weekday(day.date) }}</span>
      <span
        v-if="index === history.length - 1"
        class="size-1 rounded-full bg-green-400"
        aria-label="Сегодня"
      />
    </div>
  </div>
</template>
