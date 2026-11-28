<script setup lang="ts">
import { RotateCw } from '@lucide/vue'
import { Button } from '@/components/ui/button'

/**
 * Единственный вид сообщения об ошибке: текст + «Повторить». Раньше этот блок
 * был скопирован на семи страницах в двух раскладках.
 */
withDefaults(
  defineProps<{
    message?: string
    /** `bar` — полоса над контентом, `block` — центрированный блок вместо данных. */
    variant?: 'bar' | 'block'
  }>(),
  {
    message: 'Не удалось загрузить данные',
    variant: 'bar',
  },
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div v-if="variant === 'block'" class="flex flex-col items-center gap-3 py-8 text-center">
    <p class="text-sm text-destructive">{{ message }}</p>
    <Button variant="outline" size="sm" @click="emit('retry')">
      <RotateCw class="size-4" />
      Повторить
    </Button>
  </div>
  <div
    v-else
    class="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3"
  >
    <span class="text-sm text-destructive">{{ message }}</span>
    <Button variant="outline" size="sm" @click="emit('retry')">
      <RotateCw class="size-4" />
      Повторить
    </Button>
  </div>
</template>
