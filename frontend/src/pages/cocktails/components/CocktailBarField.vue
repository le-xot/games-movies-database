<script setup lang="ts">
import { Plus, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface BarChip {
  id: string
  name: string
}

defineProps<{
  chips: BarChip[]
  isLoading?: boolean
  /** Свой бар недоступен до входа: править набор нечем. */
  readonly?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
  add: []
}>()
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-[var(--n-action-color)] p-3">
    <div v-if="isLoading" class="flex flex-wrap gap-2">
      <Skeleton v-for="n in 3" :key="n" class="h-7 w-24 rounded-full" aria-hidden="true" />
    </div>

    <div v-else class="flex flex-wrap items-center gap-2">
      <span v-if="chips.length === 0" class="px-1 text-sm text-muted-foreground">
        {{ readonly ? 'Бар недоступен' : 'Бар пуст' }}
      </span>

      <span
        v-for="chip in chips"
        :key="chip.id"
        class="inline-flex items-center gap-1 rounded-full border border-white/15 py-0.5 pl-2.5 pr-1 text-xs text-foreground/90"
      >
        {{ chip.name }}
        <button
          type="button"
          class="cursor-pointer rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          :aria-label="`Убрать ингредиент «${chip.name}»`"
          @click="emit('remove', chip.id)"
        >
          <X class="size-3" />
        </button>
      </span>

      <Button
        v-if="!readonly"
        variant="outline"
        size="sm"
        class="rounded-full"
        @click="emit('add')"
      >
        <Plus />
        Добавить ингредиент…
      </Button>
    </div>
  </div>
</template>
