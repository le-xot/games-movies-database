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

/** Короткое значение в шапке: полная фраза живёт в `title` и `aria-label`. */
const shortValue = computed(() => (props.modelValue === 0 ? 'нет' : `+${props.modelValue}`))

function update(values: number[] | undefined) {
  const next = values?.[0]
  if (typeof next !== 'number') return
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2" :title="caption">
    <div class="flex items-center justify-between gap-3">
      <span class="text-sm font-medium">Докупать до</span>
      <span
        class="min-w-10 rounded-full border border-white/15 px-2 py-0.5 text-center text-xs tabular-nums text-muted-foreground"
      >
        {{ shortValue }}
      </span>
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
