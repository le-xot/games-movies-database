<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from '@/components/ui/slider'

const MAX_MISSING = 3
const STEPS = [0, 1, 2, 3]

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const caption = computed(() => {
  if (props.modelValue === 0) return 'Только полные совпадения'
  return `Можно не хватает до ${props.modelValue}`
})

function update(values: number[] | undefined) {
  const next = values?.[0]
  if (typeof next !== 'number') return
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2">
    <div class="flex items-baseline justify-between gap-3">
      <span class="text-sm font-medium">Недостающие ингредиенты</span>
      <span class="text-xs text-muted-foreground">{{ caption }}</span>
    </div>

    <div class="px-2">
      <Slider
        :model-value="[modelValue]"
        :min="0"
        :max="MAX_MISSING"
        :step="1"
        :aria-label="caption"
        @update:model-value="update"
      />
      <div class="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span v-for="step in STEPS" :key="step">{{ step }}</span>
      </div>
    </div>
  </div>
</template>
