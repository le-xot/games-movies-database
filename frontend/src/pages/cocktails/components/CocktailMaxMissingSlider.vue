<script setup lang="ts">
import { computed } from 'vue'
import { Slider } from '@/components/ui/slider'
import { MATCH_MAX_MISSING } from '@/pages/cocktails/composables/use-cocktail-match'
import { pluralRu } from '@/utils/plural-ru'

const STEPS = Array.from({ length: MATCH_MAX_MISSING + 1 }, (_, index) => index)
const MISSING_FORMS = ['недостающего', 'недостающих', 'недостающих'] as const
const INGREDIENT_FORMS = ['ингредиента', 'ингредиентов', 'ингредиентов'] as const

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const caption = computed(() => {
  const missing = props.modelValue
  if (missing === 0) return 'Только полные совпадения'

  const missingWord = pluralRu(missing, MISSING_FORMS)
  const ingredientWord = pluralRu(missing, INGREDIENT_FORMS)
  return `Не больше ${missing} ${missingWord} ${ingredientWord}`
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
      <span class="text-right text-xs text-muted-foreground">{{ caption }}</span>
    </div>

    <div class="px-2">
      <Slider
        :model-value="[modelValue]"
        :min="0"
        :max="MATCH_MAX_MISSING"
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
