<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { MATCH_MAX_MISSING } from '@/pages/cocktails/composables/use-cocktail-match'
import { pluralRu } from '@/utils/plural-ru'

const MISSING_FORMS = ['недостающего', 'недостающих', 'недостающих'] as const
const INGREDIENT_FORMS = ['ингредиента', 'ингредиентов', 'ингредиентов'] as const

const STRICT_EXTRAS_HINT = 'Считать «по желанию» (цедра, биттер, мята) обязательным'
/** Поиск по справочнику идёт мимо этих фильтров, поэтому во время поиска они гаснут. */
const DISABLED_HINT = 'Не влияет на поиск'

const STEPS = Array.from({ length: MATCH_MAX_MISSING + 1 }, (_, index) => index)

function stepLabel(step: number): string {
  return step === 0 ? 'нет' : `+${step}`
}

function stepHint(step: number): string {
  if (step === 0) return 'Только полные совпадения'
  return `Не больше ${step} ${pluralRu(step, MISSING_FORMS)} ${pluralRu(step, INGREDIENT_FORMS)}`
}

defineProps<{
  modelValue: number
  strictExtras: boolean
  /** Во время поиска фильтры не применяются: показываем их погашенными. */
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'update:strictExtras': [value: boolean]
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <div
      class="inline-flex rounded-md border p-0.5 transition-opacity"
      :class="disabled && 'opacity-50'"
      role="group"
      aria-label="Сколько недостающих ингредиентов можно докупить"
      :title="disabled ? DISABLED_HINT : undefined"
    >
      <Button
        v-for="step in STEPS"
        :key="step"
        size="sm"
        :variant="modelValue === step ? 'secondary' : 'ghost'"
        :aria-pressed="modelValue === step"
        :disabled="disabled"
        :aria-disabled="disabled ? 'true' : undefined"
        :title="disabled ? DISABLED_HINT : stepHint(step)"
        :aria-label="disabled ? DISABLED_HINT : stepHint(step)"
        @click="emit('update:modelValue', step)"
      >
        {{ stepLabel(step) }}
      </Button>
    </div>

    <label
      class="flex items-center gap-2 select-none transition-opacity"
      :class="[disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer']"
      :title="disabled ? DISABLED_HINT : STRICT_EXTRAS_HINT"
      :aria-disabled="disabled ? 'true' : undefined"
    >
      <Switch
        :model-value="strictExtras"
        :disabled="disabled"
        :aria-label="disabled ? DISABLED_HINT : STRICT_EXTRAS_HINT"
        @update:model-value="emit('update:strictExtras', $event)"
      />
      <span class="text-xs text-muted-foreground">по желанию</span>
    </label>
  </div>
</template>
