<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { RecordEntity } from '@/lib/api'
import { X } from 'lucide-vue-next'
import { ref, watch } from 'vue'

type Phase = 'idle' | 'selecting' | 'selected'

const props = defineProps<{
  items: RecordEntity[]
}>()

const emit = defineEmits<{
  (e: 'approve', id: number): void
}>()

const open = defineModel<boolean>('open', { required: true })

const phase = ref<Phase>('idle')
const currentItem = ref<RecordEntity>()

const isSelecting = () => phase.value === 'selecting'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function startSelection() {
  if (props.items.length === 0) return

  phase.value = 'selecting'
  currentItem.value = undefined

  const finalWinnerIndex = Math.floor(Math.random() * props.items.length)
  const finalWinner = props.items[finalWinnerIndex]

  const duration = 1000
  const startTime = Date.now()
  const minDelay = 350
  const maxDelay = 550

  while (Date.now() - startTime < duration) {
    const randomIndex = Math.floor(Math.random() * props.items.length)
    currentItem.value = props.items[randomIndex]

    const progress = (Date.now() - startTime) / duration
    const easedProgress = progress ** 3
    const currentDelay = minDelay + (maxDelay - minDelay) * easedProgress

    await sleep(currentDelay)
  }

  currentItem.value = finalWinner

  await sleep(500)

  phase.value = 'selected'
}

function approve() {
  if (currentItem.value) {
    emit('approve', currentItem.value.id)
    open.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    startSelection()
  } else {
    phase.value = 'idle'
  }
})
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div class="bg-background p-8 rounded-lg max-w-2xl w-full shadow-xl border border-border relative">
      <Button
        variant="ghost"
        size="icon"
        class="absolute right-2 top-2 rounded-full h-8 w-8 p-0"
        :disabled="isSelecting()"
        @click="open = false"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Close</span>
      </Button>
      <div v-if="isSelecting()" class="flex flex-col gap-6">
        <h1 class="text-4xl font-bold text-center animate-pulse">
          Выбираем победителя...
        </h1>
        <div class="h-[300px] flex items-center justify-center p-4">
          <img
            v-if="currentItem?.posterUrl"
            :key="currentItem.id"
            :src="currentItem.posterUrl"
            class="max-h-full object-contain mx-auto opacity-70 animate-in fade-in"
            alt="Постер"
          >
          <div v-else class="text-muted-foreground">
            Крутим барабан...
          </div>
        </div>
      </div>
      <div v-else-if="phase === 'selected' && currentItem" class="flex flex-col gap-4 text-center">
        <h1 class="text-4xl font-bold">
          {{ currentItem.title || 'Без названия' }}
        </h1>
        <div class="h-[300px] p-4 flex items-center justify-center">
          <img
            v-if="currentItem.posterUrl"
            :src="currentItem.posterUrl"
            class="max-h-full object-contain mx-auto"
            alt="Постер"
          >
          <div v-else class="text-muted-foreground">
            Нет изображения
          </div>
        </div>
        <div v-if="currentItem.user" class="text-base font-medium">
          Предложил: {{ currentItem.user!.login }}
        </div>
        <div class="font-bold text-2xl text-green-500">
          🎉 Победитель! 🎉
        </div>
        <div class="flex gap-4 justify-center mt-4">
          <Button variant="default" size="lg" @click="approve">
            Принять
          </Button>
          <Button variant="secondary" size="lg" @click="startSelection">
            Ещё разок
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
