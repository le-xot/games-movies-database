<script setup lang="ts">
import { PartyPopper, Frown } from '@lucide/vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { WordleGameStatus } from '@/lib/api'
import { useWordleShare } from '@/pages/wordle/composables/use-wordle-share'

const props = withDefaults(
  defineProps<{
    open: boolean
    status: WordleGameStatus
    answer: string | null
    attempts: number
    currentStreak: number
    mode?: 'daily' | 'practice'
  }>(),
  { mode: 'daily' },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  'show-stats': []
  'play-again': []
}>()

const { shareResult, isSharing } = useWordleShare()

const isPractice = computed(() => props.mode === 'practice')

function openStats() {
  emit('show-stats')
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-sm">
      <DialogHeader class="items-center text-center">
        <div
          class="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-secondary"
        >
          <PartyPopper v-if="status === WordleGameStatus.WON" class="size-7 text-green-500" />
          <Frown v-else class="size-7 text-destructive" />
        </div>
        <DialogTitle>
          {{ status === WordleGameStatus.WON ? 'Победа!' : 'Не угадали' }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          {{ isPractice ? 'Результат тренировки «Вордли»' : 'Результат партии «Вордли»' }}
        </DialogDescription>
      </DialogHeader>

      <p class="text-center text-sm text-muted-foreground">
        {{ isPractice ? 'Слово:' : 'Слово дня:' }}
        <span class="font-semibold uppercase text-foreground">{{ answer }}</span>
      </p>

      <p v-if="status === WordleGameStatus.WON" class="text-center text-sm text-muted-foreground">
        Попыток: {{ attempts }}<template v-if="!isPractice"> · серия: {{ currentStreak }}</template>
      </p>
      <p v-else class="text-center text-sm text-muted-foreground">
        {{ isPractice ? 'Попробуйте ещё раз' : 'Попробуйте завтра — слово будет новое' }}
      </p>

      <div class="flex flex-col gap-2">
        <Button v-if="isPractice" @click="emit('play-again')">Ещё слово</Button>
        <Button v-else :disabled="isSharing" @click="shareResult">Поделиться</Button>
        <Button v-if="!isPractice" variant="outline" @click="openStats">Статистика</Button>
        <Button variant="outline" @click="emit('update:open', false)">Закрыть</Button>
      </div>
    </DialogScrollContent>
  </Dialog>
</template>
